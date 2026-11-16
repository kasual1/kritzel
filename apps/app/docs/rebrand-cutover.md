# Rebrand cutover: Updraw → Upmade

One-time runbook for moving production from Updraw (`~/updraw-app`, compose project `updraw-app`, `@updraw/*` on npm) to Upmade (`~/upmade-app`, compose project `upmade-app`, database `upmade`, `@upmade/*`, upmade.io and app.upmade.io).

Production has no users yet, so no data is carried over: the Upmade app starts with a new, empty database, and the site and the app move to the new domains in one step. The Updraw stack (`~/updraw-app` and its volume `updraw-app_pgdata_prod`) is only stopped, so it can be started again until step 6 removes it.

The Kritzel → Updraw cutover was done on 2026-11-13; its runbook is in the [git history of this file](https://github.com/kasual1/kritzel/blob/10209754c827c34517fcd20f234d5f3d0cf3ec5d/apps/app/docs/rebrand-cutover.md).

Do the steps in order. `gh` commands run from a clone of the repository; `docker` commands run on the Lightsail instance.

| # | Step | When | Downtime |
|---|------|------|----------|
| 0 | [Current hosts](#0-current-hosts) | Before anything else | No |
| 1 | [Prerequisites](#1-before-merging) | Before merging the rebrand | No |
| 2 | [Publish the libraries](#2-after-merging-publish-the-libraries) | Right after merging | No |
| 3 | [Switch the server](#3-switch-the-server) | After step 2 | Yes, until step 4 |
| 4 | [Deploy](#4-deploy) | Right after step 3 | Ends here |
| 5 | [Old hosts](#5-old-hosts) | After step 4 is verified | No |
| 6 | [Afterwards](#6-afterwards) | Once the new app works | No |

> [!WARNING]
> After the merge, `deploy-app` deploys to `~/upmade-app`. It refuses to run until `~/upmade-app/.env` exists and the `updraw-app` stack is stopped (step 3), and until `@upmade/*` packages of the version in `libs/` are on npm (step 2). A `deploy-app` run before step 2 fails at "Switch client to published upmade packages". That is expected.

## 0. Current hosts

The current site and app may run on kritzel.io or on updraw.io (the first cutover could keep kritzel.io). Check which, so you know the old hosts to redirect in step 5:

```bash
gh variable list                                   # WEBSITE_URL / APP_URL set: the origins the current builds use
ssh <lightsail> "grep -E '^(CLIENT_URL|GOOGLE_CALLBACK_URL)=' ~/updraw-app/.env"
```

`deploy-website` and `deploy-app` take the public origins from the repository variables `WEBSITE_URL` and `APP_URL` (Settings → Secrets and variables → Actions → Variables). Unset, they build for https://upmade.io and https://app.upmade.io. If they are set, delete both before the first `deploy-website` or `deploy-app` after the merge. To deploy under another domain, set them to that origin instead.

## 1. Before merging

### npm

1. Create the `upmade` organization on npmjs.com, owned by the account that owns the `@updraw` packages. If the name is taken, stop: the package names would have to change, which this runbook does not cover.
2. Create a granular access token with read and write access to the `@upmade` scope.
3. Check the token and store it as the `NPM_TOKEN` repository secret (used by `deploy-libs`; it replaces the `@updraw` token):

```bash
read -rs NPM_TOKEN                      # paste the new token
npmrc=$(mktemp)
printf '//registry.npmjs.org/:_authToken=%s\n' "$NPM_TOKEN" > "$npmrc"
npm whoami --userconfig "$npmrc"                            # the publishing account
npm access list packages @upmade --userconfig "$npmrc"      # empty before the first publish; an error means no access
gh secret set NPM_TOKEN <<< "$NPM_TOKEN"
rm "$npmrc"; unset NPM_TOKEN
```

### Rollback tag

Tag the last commit before the merge, so the Updraw version can be deployed again (see [Rollback](#rollback)). The `pre-updraw` tag from the first cutover stays.

```bash
git fetch origin
git tag pre-upmade origin/main
git push origin pre-upmade
```

### DNS and TLS (Cloudflare)

- In the upmade.io zone, point `app.upmade.io` at the Lightsail static IP (the same address as the current app host), proxied.
- Use the same SSL/TLS encryption mode as the current app's zone. The origin's nginx only listens on :80, so a mode that connects to the origin over HTTPS fails. Copy "Always Use HTTPS" and keep WebSockets enabled.

nginx answers for any host name, so the running Updraw app is already reachable on the new name:

```bash
dig +short app.upmade.io
curl -sS https://app.upmade.io/api/config      # JSON from the running api
```

### Cloudflare Pages

Add `upmade.io` (and `www.upmade.io` if used) as a custom domain of the existing Pages project (`CLOUDFLARE_PAGES_PROJECT_NAME`). Keep the current domains attached until step 5.

```bash
curl -sI https://upmade.io/ | head -n 1        # 200
```

### Google OAuth (Google Cloud console, APIs & Services)

- OAuth consent screen: add `upmade.io` to the authorized domains, and update the app name, home page, privacy policy and terms links. Branding changes can need re-verification, so do this early.
- OAuth client: add the redirect URI `https://app.upmade.io/api/auth/google/callback`. If JavaScript origins are set, add `https://app.upmade.io`. Keep the entries of the current app until step 6.

### Cloudflare R2

The client loads uploaded images with `fetch` from `R2_PUBLIC_BASE_URL`, so add `https://app.upmade.io` to the bucket's CORS allowed origins. `R2_BUCKET` and `R2_PUBLIC_BASE_URL` can stay as they are. If the host in `R2_PUBLIC_BASE_URL` is on the kritzel.io or updraw.io zone, keep it out of the redirects in step 5.

## 2. After merging: publish the libraries

Run `deploy-libs`. `@upmade/*` has no releases yet, so any bump publishes the first one; the last `@updraw/*` and `@kritzel/*` releases are both 0.6.2. `deploy-app` refuses to run until the `@upmade/*` packages for the current version are on npm.

```bash
gh workflow run deploy-libs.yml -f bump=minor     # or patch
gh run watch
```

Check every package once the run has finished:

```bash
git pull
VERSION=$(node -p "require('./libs/editor/core/package.json').version")
for pkg in core engine editor angular-engine angular-editor react-engine react-editor vue-engine vue-editor; do
  echo "@upmade/$pkg: $(npm view "@upmade/$pkg@$VERSION" version)"
done
```

## 3. Switch the server

Before you start:

```bash
test ! -e ~/upmade-app && echo ok                                                        # must not exist yet
docker volume inspect upmade-app_pgdata_prod > /dev/null 2>&1 && echo exists || echo ok   # must not exist yet
```

If `~/upmade-app` exists, move it aside (`mv ~/upmade-app ~/upmade-app.early`). If `upmade-app_pgdata_prod` exists (an earlier attempt), remove it with `docker volume rm upmade-app_pgdata_prod`, so the new stack starts on an empty database.

The app is down from here until `deploy-app` has finished (step 4):

```bash
cd ~/updraw-app
docker compose -f docker-compose.prod.yml down         # no -v: the old volume stays, for a rollback
mkdir ~/upmade-app
cp ~/updraw-app/.env ~/upmade-app/.env
cd ~/upmade-app
grep -nEi 'kritzel|updraw' .env                        # values that still name an old brand
vi .env
grep -E '^(POSTGRES_PASSWORD|DATABASE_URL|CLIENT_URL|GOOGLE_CALLBACK_URL)=' .env
```

Change these values:

| Variable | New value |
|----------|-----------|
| `DATABASE_URL` | `postgresql://postgres:<POSTGRES_PASSWORD>@postgres:5432/upmade` |
| `CLIENT_URL` | `https://app.upmade.io` |
| `GOOGLE_CALLBACK_URL` | `https://app.upmade.io/api/auth/google/callback` |

- The new stack gets a new, empty volume, `upmade-app_pgdata_prod`. On its first start Postgres takes its password from `POSTGRES_PASSWORD` (`postgres` if unset) and `database/init.sql` creates the database `upmade`. The password in `DATABASE_URL` must be the same; the old volume's password does not carry over.
- Leave `JWT_SECRET`, `GOOGLE_CLIENT_*`, `R2_*` and `API_URL` unchanged. The compose files pass no other variables (see `.env.example`), so any other old name the grep shows is unused.
- `~/updraw-app` and the `updraw-app_pgdata_prod` volume stay as they are: they are the [rollback](#rollback). Never run `down -v` in `~/updraw-app`, it deletes that volume.

## 4. Deploy

```bash
gh workflow run deploy-app.yml
gh run watch
```

The workflow copies the app to `~/upmade-app` and starts the `upmade-app` stack. Postgres initializes the new volume, and on startup the api runs all migrations on the empty database; the two rebrand migrations find nothing to move. The websocket service waits until the api's healthcheck passes.

Check the deploy:

```bash
cd ~/upmade-app
docker compose -f docker-compose.prod.yml ps                                   # api healthy, all services running
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d upmade \
  -c 'SELECT name FROM migrations ORDER BY id'                                 # last: RenameUpdrawDocumentIds1794783600000
```

Sign in on https://app.upmade.io, create a workspace, add an image (checks R2 CORS) and reload the page.

If the api never gets healthy, read `docker compose -f docker-compose.prod.yml logs api`. A password error means `DATABASE_URL` does not match `POSTGRES_PASSWORD`: fix `.env`, run `docker compose -f docker-compose.prod.yml down -v` in `~/upmade-app` (it deletes only the new `upmade-app_pgdata_prod`) and run `deploy-app` again.

Then deploy the website and the demos:

```bash
gh workflow run deploy-website.yml
gh workflow run deploy-demos.yml
```

## 5. Old hosts

Redirect every old host to upmade.io with path-preserving rules (Rules → Redirect Rules), status 301, "Preserve query string" on. The website's own redirects then send the pages renamed in the rebrand (blog posts, media, the `migrating-to-updraw` docs) to their new paths.

In the kritzel.io zone, the first cutover's rules point at updraw.io if it moved the site there: change their targets to upmade.io instead of adding rules, so there is only one hop; otherwise add them. In the updraw.io zone (if set up), replace the first cutover's temporary 302 rule if there is one. The rules:

| Zone | Matches | Target URL (dynamic) |
|------|---------|----------------------|
| kritzel.io | `(http.host in {"kritzel.io" "www.kritzel.io"})` | `concat("https://upmade.io", http.request.uri.path)` |
| kritzel.io | `(http.host eq "app.kritzel.io" and http.request.uri.path ne "/ngsw.json")` | `concat("https://app.upmade.io", http.request.uri.path)` |
| updraw.io | `(http.host in {"updraw.io" "www.updraw.io"})` | `concat("https://upmade.io", http.request.uri.path)` |
| updraw.io | `(http.host eq "app.updraw.io" and http.request.uri.path ne "/ngsw.json")` | `concat("https://app.upmade.io", http.request.uri.path)` |

Match host names only, never the whole zone, so the R2 asset host keeps working if it is on one of these zones.

`/ngsw.json` on each old app host must return **404**. On a 404 the Angular service worker deletes its caches and unregisters itself. A redirected `ngsw.json` looks like a network error to it, and it keeps serving the cached old app. The first cutover may already have a Worker on `app.kritzel.io/ngsw.json*`; add the same Worker on `app.updraw.io/ngsw.json*`:

```js
export default {
  fetch: () => new Response('Not found', { status: 404, headers: { 'cache-control': 'no-store' } }),
};
```

The old app hosts still resolve to the Lightsail instance, so `/api` and `/ws` on them must not reach the backend anymore. Check (drop the updraw.io hosts if they were never set up):

```bash
for host in app.kritzel.io app.updraw.io; do
  curl -sI "https://$host/some-workspace?share=true" | grep -iE '^(HTTP|location)'    # 301 to app.upmade.io, same path and query
  curl -sI "https://$host/api/config" | grep -iE '^(HTTP|location)'                    # 301, not 200
  curl -si --http1.1 -H 'Connection: Upgrade' -H 'Upgrade: websocket' -H 'Sec-WebSocket-Version: 13' \
    -H 'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==' "https://$host/ws" | head -n 1     # 301, never 101
  curl -sI "https://$host/ngsw.json" | head -n 1                                        # 404
done
for host in kritzel.io updraw.io; do
  curl -sI "https://$host/docs/?ref=x" | grep -iE '^(HTTP|location)'                   # 301 to upmade.io, same path and query
done
for host in kritzel.io updraw.io; do
  curl -sIL "https://$host/blog/2026/08/02/introducing-updraw/" | grep -iE '^(HTTP|location)'   # ends with 200 on upmade.io
done
```

## 6. Afterwards

- **Umami:** change the website's domain to upmade.io (same website id, see `apps/website/docusaurus.config.ts`).
- **Search Console:** verify upmade.io (domain property), submit `https://upmade.io/sitemap.xml`, then use "Change of address" on the property of the domain the site moved from. If kritzel.io already has a change of address to updraw.io, check whether Search Console lets you point it at upmade.io (not verified here).
- **npm:** deprecate the Updraw packages (needs an owner of `@updraw`; add `--otp=<code>` if 2FA asks for it). Optionally point the `@kritzel` deprecations at the new names too, so nobody moves twice:

```bash
for pkg in core engine editor angular-engine angular-editor react-engine react-editor vue-engine vue-editor; do
  npm deprecate "@updraw/$pkg" "Renamed to @upmade/$pkg"
  npm deprecate "@kritzel/$pkg" "Renamed to @upmade/$pkg"   # optional, needs an owner of @kritzel
done
```

- **Remove the Updraw stack** once you won't roll back anymore, together with the first cutover's leftovers if they are still there, and the old app hosts' entries in Google OAuth and R2 CORS:

```bash
docker volume rm updraw-app_pgdata_prod
rm -rf ~/updraw-app
docker volume ls | grep kritzel-app      # first cutover's volume, if kept: docker volume rm kritzel-app_pgdata_prod
rm -f ~/pre-updraw.sql
```

- Keep kritzel.io and updraw.io registered: they serve the redirects (and the assets, if `R2_PUBLIC_BASE_URL` is on one of them).

## Rollback

Until step 6, the Updraw app can be started again with its old data:

```bash
cd ~/upmade-app && docker compose -f docker-compose.prod.yml down
cd ~/updraw-app && docker compose -f docker-compose.prod.yml up -d      # add --build if its images were removed
```

Then revert the redirect rules and the `ngsw.json` Workers from step 5, if you set them. To redeploy the Updraw website, run `gh workflow run deploy-website.yml --ref pre-upmade` (with `WEBSITE_URL` and `APP_URL` set back if the old site was not on updraw.io).

To try the cutover again later, start step 3 from a clean state: `rm -rf ~/upmade-app` and `docker volume rm upmade-app_pgdata_prod`.
