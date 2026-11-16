# Rebrand cutover: Updraw → Upmade

One-time runbook for moving production from Updraw (`~/updraw-app`, compose project `updraw-app`, volume `updraw-app_pgdata_prod`, database `updraw`, `@updraw/*` on npm, documents `updraw-*`) to Upmade (`~/upmade-app`, `upmade-app`, `upmade-app_pgdata_prod`, database `upmade`, `@upmade/*`, upmade.io and app.upmade.io).

The Kritzel → Updraw cutover was done on 2026-11-13; its runbook is in the [git history of this file](https://github.com/kasual1/kritzel/blob/10209754c827c34517fcd20f234d5f3d0cf3ec5d/apps/app/docs/rebrand-cutover.md).

Do the steps in order. `gh` commands run from a clone of the repository; `docker` commands run on the Lightsail instance.

| # | Step | When | Downtime |
|---|------|------|----------|
| 0 | [Current hosts](#0-current-hosts) | Before anything else | No |
| 1 | [Prerequisites](#1-before-merging) | Before merging the rebrand | No |
| 2 | [Publish the libraries](#2-after-merging-publish-the-libraries) | Right after merging | No |
| 3 | [Lightsail maintenance window](#3-lightsail-maintenance-window) | After step 2 | Yes, until step 4 |
| 4 | [Deploy](#4-deploy) | Right after step 3 | Ends here |
| 5 | [Old hosts](#5-old-hosts) | After step 4 is verified | No |
| 6 | [Afterwards](#6-afterwards) | Following days | No |

> [!WARNING]
> After the merge, `deploy-app` deploys to `~/upmade-app`. It refuses to run until `~/upmade-app/.env` exists and the `updraw-app` stack is stopped (step 3), and until `@upmade/*` packages of the version in `libs/` are on npm (step 2). Nothing is published under `@upmade` before step 2, so a `deploy-app` run before it fails at "Switch client to published upmade packages". That is expected.

## 0. Current hosts

The Kritzel → Updraw cutover could keep the site on kritzel.io (its phase 1), so check where production is served from before choosing the hosts below:

```bash
gh variable list                                   # WEBSITE_URL / APP_URL set: the site and app use these origins
ssh <lightsail> "grep -E '^(CLIENT_URL|GOOGLE_CALLBACK_URL)=' ~/updraw-app/.env"
```

Without the variables, the Updraw build used updraw.io and app.updraw.io. This runbook calls the origins in use now the **current site** and the **current app** (`https://kritzel.io` / `https://app.kritzel.io`, or `https://updraw.io` / `https://app.updraw.io`). In the end both kritzel.io and updraw.io are old hosts that redirect to upmade.io; updraw.io only if it was set up.

## Moving in two phases (optional)

The rename and the domain move can be split: first deploy Upmade on the current domains, and switch to upmade.io later. The website and the app read their public origins from two repository variables (Settings → Secrets and variables → Actions → Variables). When they are unset, the defaults are upmade.io and app.upmade.io.

| Variable | Phase 1 | Phase 2 |
|----------|---------|---------|
| `WEBSITE_URL` | the current site | delete |
| `APP_URL` | the current app | delete |

`deploy-website` uses them for canonical URLs, the sitemap, `robots.txt`, `llms.txt` and the links to the app; `deploy-app` uses `APP_URL` for the client's `robots.txt` and `sitemap.xml`. The app itself works on any domain.

**Phase 1: Upmade on the current domains**

1. Set both variables as in the table (if the Updraw cutover is still in its phase 1, they already point at kritzel.io: leave them).
2. Step 1: do only [npm](#npm) and the [rollback tag](#rollback-tag). Skip DNS and TLS, Cloudflare Pages, Google OAuth and R2.
3. Steps 2 to 4 as described, with one difference in step 3: in `.env`, change only `DATABASE_URL`. `CLIENT_URL` and `GOOGLE_CALLBACK_URL` stay on the current app.
4. Skip step 5.
5. Make upmade.io resolve, because the "Powered by Upmade" watermark in the published packages and the documentation link to `https://upmade.io`. In the upmade.io zone, add a proxied DNS record for the apex (e.g. `A @ 192.0.2.1`, proxied; Cloudflare answers before the address is used) and a redirect rule `(http.host in {"upmade.io" "www.upmade.io"})` → `concat("<current site>", http.request.uri.path)` with status **302** and "Preserve query string" on. Use 302, not 301: browsers cache 301 redirects, and this one is reversed in phase 2.

While the app stays on the current app origin, nobody loses local data: the libraries move each browser's settings, local workspaces and assets (also those of guests) from the Updraw and Kritzel names to the Upmade ones, and the client carries over its guest user, cached config and Welcome markers (`apps/app/client/src/app/legacy-storage.ts`). The session cookie (`token`) has no brand name, so signed-in users stay signed in.

**Phase 2: switch to upmade.io**

1. Delete the phase 1 redirect rule on upmade.io.
2. Step 1: do [DNS and TLS](#dns-and-tls-cloudflare), [Cloudflare Pages](#cloudflare-pages), [Google OAuth](#google-oauth-google-cloud-console-apis--services) and [R2](#cloudflare-r2).
3. Delete the variables `WEBSITE_URL` and `APP_URL`.
4. On the server, back up `.env` and set `CLIENT_URL` and `GOOGLE_CALLBACK_URL` to app.upmade.io as in step 3, then run `deploy-app` and `deploy-website`. No maintenance window is needed: the database and the documents were already moved in phase 1.
5. Steps 5 and 6. The [accepted data losses](#accepted-data-losses) of the domain move apply here.

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

Tag the last commit before the merge, so the Updraw app can be redeployed (see [Rollback](#rollback)). The `pre-updraw` tag from the first cutover stays.

```bash
git fetch origin
git tag pre-upmade origin/main
git push origin pre-upmade
```

### DNS and TLS (Cloudflare)

- This assumes upmade.io is registered and added to Cloudflare as a zone; the repository can't show whether it is yet.
- In the upmade.io zone, point `app.upmade.io` at the Lightsail static IP (the same address as the current app host), proxied.
- Use the same SSL/TLS encryption mode as the current app's zone. The origin's nginx only listens on :80, so a mode that connects to the origin over HTTPS fails. Copy "Always Use HTTPS" and keep WebSockets enabled.

nginx answers for any host name, so the running Updraw app is already reachable on the new name. Check it with curl only; don't use the app on app.upmade.io before the cutover.

```bash
dig +short app.upmade.io
curl -sS https://app.upmade.io/api/config      # JSON from the running api
```

### Cloudflare Pages

Add `upmade.io` (and `www.upmade.io` if used) as a custom domain of the existing Pages project (`CLOUDFLARE_PAGES_PROJECT_NAME`). Keep the current domains attached for now.

```bash
curl -sI https://upmade.io/ | head -n 1        # 200
```

### Google OAuth (Google Cloud console, APIs & Services)

- OAuth consent screen: add `upmade.io` to the authorized domains, and update the app name, home page, privacy policy and terms links. Branding changes can need re-verification, so do this early.
- OAuth client: add the redirect URI `https://app.upmade.io/api/auth/google/callback`. If JavaScript origins are set, add `https://app.upmade.io`. Keep the entries of the current app (and of app.kritzel.io, if still listed) until the rollback window is over.

### Cloudflare R2

R2 holds the images users upload: the api stores each one in `R2_BUCKET` under `users/<userId>/<assetId>`, and the client loads it with `fetch` from `<R2_PUBLIC_BASE_URL>/users/<userId>/<assetId>`, taking the base URL from `/api/config`. Documents store the asset id, not its URL.

- Add `https://app.upmade.io` to the bucket's CORS allowed origins. Keep the current app's origin until the cutover is verified.
- Keep `R2_BUCKET` and `R2_PUBLIC_BASE_URL` as they are, even if they name an old brand: the objects stay where they are, and every client builds its asset URLs from `R2_PUBLIC_BASE_URL`. If that host is on the kritzel.io or updraw.io zone, it must keep working: leave it out of the redirects in step 5, and keep the domain. Moving the bucket or the public host is a separate change (copy the objects, then update both values) that this runbook does not cover.

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

## 3. Lightsail maintenance window

Before the window, check that the move can't fail halfway:

```bash
test ! -e ~/upmade-app && echo ok                # must not exist, or mv would nest the directory
docker volume ls | grep pgdata_prod              # updraw-app_pgdata_prod (and kritzel-app_pgdata_prod, if the first cutover's copy is still kept)
docker system df -v | grep pgdata_prod           # size of the volume that is copied
df -h /var/lib/docker ~                          # room for a second copy of it and a dump
```

If the disk is short, remove the first cutover's leftovers first (`kritzel-app_pgdata_prod`, `~/pre-updraw.sql`): rolling back this cutover doesn't need them.

The app is down from the first `stop` until `deploy-app` has finished (step 4).

```bash
cd ~/updraw-app
docker compose -f docker-compose.prod.yml stop nginx client websocket api       # the app is down from here
docker compose -f docker-compose.prod.yml exec -T postgres pg_dumpall -U postgres > ~/pre-upmade.sql
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -l   # confirm the real DB name
docker compose -f docker-compose.prod.yml down          # no -v
cd ~ && test ! -e ~/upmade-app && mv ~/updraw-app ~/upmade-app && cd ~/upmade-app
docker compose -p upmade-app -f docker-compose.prod.yml create postgres
docker volume inspect updraw-app_pgdata_prod > /dev/null   # fails if the old volume has another name
docker run --rm -v updraw-app_pgdata_prod:/from:ro -v upmade-app_pgdata_prod:/to alpine sh -c 'cp -a /from/. /to/'
docker compose -p upmade-app -f docker-compose.prod.yml up -d postgres
docker compose -p upmade-app -f docker-compose.prod.yml exec -T postgres psql -U postgres -d postgres -c 'ALTER DATABASE updraw RENAME TO upmade'
```

- If `psql -l` shows another database name than `updraw` (compare `DATABASE_URL` in `.env`), use that name in `ALTER DATABASE`.
- Stop the stack **before** `mv`: its containers bind-mount files from `~/updraw-app`, and the dump must not miss writes.
- Until step 4 copies the new files, `~/upmade-app` still holds the Updraw compose file, which sets `name: updraw-app`. `-p upmade-app` overrides it, so the new volume is `upmade-app_pgdata_prod`; without it, compose would start the old project on the old volume again.
- Never use `down -v`: it deletes the database volume.
- If `test ! -e ~/upmade-app` fails, someone created the directory: move it aside (`mv ~/upmade-app ~/upmade-app.early`) and continue. If `docker volume inspect` fails, look up the real volume name with `docker volume ls` and use it in the copy; `docker run -v` would otherwise create an empty volume and copy nothing.
- `create postgres` creates the empty `upmade-app_pgdata_prod` volume without starting Postgres, so `init.sql` never runs on it. The old `updraw-app_pgdata_prod` volume is only read, and stays as the rollback copy.

Check the result:

```bash
grep -c 'database cluster dump complete' ~/pre-upmade.sql                                      # 1
docker volume ls | grep pgdata_prod                                                             # updraw-app_… and upmade-app_…
docker compose -p upmade-app -f docker-compose.prod.yml exec -T postgres psql -U postgres -l     # upmade, no updraw
docker compose -p upmade-app -f docker-compose.prod.yml exec -T postgres psql -U postgres -d upmade -c 'SELECT count(*) FROM documents'
docker compose -p upmade-app -f docker-compose.prod.yml exec -T postgres psql -U postgres -d upmade -c 'SELECT name FROM migrations ORDER BY id'   # last: RenameLegacyBrandDocumentIds1794575000000
```

Then back up and edit `.env`. List every value that still names an old brand, and change these three:

| Variable | New value |
|----------|-----------|
| `DATABASE_URL` | Same URL with the database name `upmade`, e.g. `postgresql://postgres:<password>@postgres:5432/upmade` |
| `CLIENT_URL` | `https://app.upmade.io` (phase 1: unchanged) |
| `GOOGLE_CALLBACK_URL` | `https://app.upmade.io/api/auth/google/callback` (phase 1: unchanged) |

```bash
cp .env .env.pre-upmade
grep -nEi 'kritzel|updraw' .env
vi .env
grep -E '^(DATABASE_URL|CLIENT_URL|GOOGLE_CALLBACK_URL)=' .env
```

Leave `R2_*` (including `R2_BUCKET` and `R2_PUBLIC_BASE_URL`, see [R2](#cloudflare-r2)), `JWT_SECRET`, `GOOGLE_CLIENT_*`, `API_URL` and `POSTGRES_PASSWORD` unchanged; the copied volume keeps its password, and `POSTGRES_PASSWORD` only applies when a volume is initialized. The compose files pass no other variables (see `.env.example`), so any other old name the grep shows is unused.

## 4. Deploy

```bash
gh workflow run deploy-app.yml
gh run watch
```

What happens on the server:

- `docker-compose.prod.yml` sets `name: upmade-app`, so the stack uses `upmade-app_pgdata_prod`, and `--force-recreate` replaces the Postgres container from step 3.
- On startup the api runs the TypeORM migration `RenameUpdrawDocumentIds1794783600000`, in one transaction. The first rebrand's `RenameLegacyBrandDocumentIds1794575000000` is already recorded and does not run again.
  - every `updraw-*` document id becomes `upmade-*`, and so does any `kritzel-*` row the first migration left behind because it could not merge it;
  - if both ids exist and belong to the same user, the Yjs states are merged into one row that keeps the original (legacy) row's owner, visibility and type;
  - if both ids exist but the `upmade-*` row belongs to someone else (document ids appear in share links), that row is set aside as `rename-conflict-upmade-*` and the original document takes the id;
  - the documents' content is not rewritten: `Kritzel*` and `Updraw*` class names stay as they are, the libraries read them and save objects as `Upmade*` once they change. Rewriting them on the server would conflict with edits browsers made offline during the window. Rows set aside as `rename-conflict-updraw-*` by the first cutover keep their ids.
- The websocket service waits until the api's healthcheck passes, so no client connects while the migration runs. If the migration fails, the api never gets healthy and the deploy fails before websocket starts.
- The websocket server rejects `updraw-*` and `kritzel-*` document names from stale clients (Updraw bundles cached by the service worker), so they can't create rows under the old names. Those tabs get the new version once their service worker updates.

Check the deploy:

```bash
cd ~/upmade-app
docker compose -f docker-compose.prod.yml ps                                                    # api healthy, all services running
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d upmade \
  -c 'SELECT name FROM migrations ORDER BY id DESC LIMIT 1'                                     # RenameUpdrawDocumentIds1794783600000
docker compose -f docker-compose.prod.yml logs api | grep RenameUpdrawDocumentIds              # no output = no conflicts, nothing skipped
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d upmade \
  -c "SELECT count(*) FILTER (WHERE id LIKE 'updraw-%' OR id LIKE 'kritzel-%') AS legacy, count(*) FILTER (WHERE id LIKE 'rename-conflict-%') AS set_aside, count(*) AS total FROM documents"
```

TypeORM's migration logging is off, so the api log only shows the migration's warnings, each prefixed with `[RenameUpdrawDocumentIds1794783600000]`:

- `"upmade-…" belongs to another user; moved it to "rename-conflict-upmade-…"`: a document set aside after a conflict. Its owner is in `user_id`.
- `Could not merge "…" into "…", leaving both in place`: the legacy row could not be decoded; it keeps its id and its data.

`legacy` must be 0, except for rows a "Could not merge" line names.

Sign in on https://app.upmade.io (phase 1: the current app) and open a few existing workspaces, including one with images (checks R2 CORS).

Then deploy the website and the demos:

```bash
gh workflow run deploy-website.yml
gh workflow run deploy-demos.yml
```

## 5. Old hosts

Redirect every old host to upmade.io with path-preserving rules (Rules → Redirect Rules), status 301, "Preserve query string" on. The website's own redirects then send the pages renamed in the rebrand (blog posts, media, the `migrating-to-updraw` docs) to their new paths.

In the kritzel.io zone, the first cutover's rules point at updraw.io if it got to its phase 2: change their targets to upmade.io instead of adding rules, so there is only one hop; otherwise add them. In the updraw.io zone (if set up), replace the first cutover's phase 1 302 rule if there is one. The rules:

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

- **Keep the old data until the cutover is verified** (e.g. two weeks): the `updraw-app_pgdata_prod` volume, `~/pre-upmade.sql` and `~/upmade-app/.env.pre-upmade`. Then remove them, together with the first cutover's leftovers if they are still there (`kritzel-app_pgdata_prod`, `~/pre-updraw.sql`, `~/upmade-app/.env.pre-updraw`), and the old app hosts' entries in Google OAuth and R2 CORS:

```bash
docker volume rm updraw-app_pgdata_prod
rm ~/pre-upmade.sql ~/upmade-app/.env.pre-upmade
```

- Keep kritzel.io and updraw.io registered: they serve the redirects (and the assets, if `R2_PUBLIC_BASE_URL` is on one of them).

## Rollback

The old volume still holds the database `updraw` as it was before step 3. Changes made after the cutover are only in `upmade-app_pgdata_prod` and are not carried back.

**Before `deploy-app` ran** (the server still has the Updraw compose files):

```bash
cd ~/upmade-app
docker compose -p upmade-app -f docker-compose.prod.yml down    # no -v; only the Postgres from step 3
mv ~/upmade-app ~/updraw-app && cd ~/updraw-app
cp .env.pre-upmade .env                                         # only if .env was already edited
docker compose -f docker-compose.prod.yml up -d
```

**After `deploy-app` ran:** start from a clean directory. `scp` doesn't delete files, so the new migration would otherwise be built into the Updraw api and rename the documents again.

```bash
cd ~/upmade-app
docker compose -f docker-compose.prod.yml down    # no -v
mv ~/upmade-app ~/upmade-app.rolled-back
mkdir ~/updraw-app
cp ~/upmade-app.rolled-back/.env.pre-upmade ~/updraw-app/.env
```

Then redeploy the old ref, which deploys to `~/updraw-app` with the `updraw-app` compose project and volume, using the `@updraw/*` packages already on npm:

```bash
gh workflow run deploy-app.yml --ref pre-upmade
```

If the `app-prod` environment only allows deployments from `main`, allow the `pre-upmade` tag in its deployment branch and tag rules first (repository settings, Environments). The new migration's `down()` only renames `upmade-*` ids back to `updraw-*`; objects edited after the cutover are saved as `Upmade*`, which the Updraw app cannot read, so roll back from the old volume as above, never with `migration:revert`.

Finally, revert the redirect rules and the `ngsw.json` Workers from step 5 (back to the first cutover's targets). Browser-local data the Upmade client wrote (guest work, settings) stays under the Upmade names, which the Updraw client does not read. Last resort if a volume is damaged: restore `~/pre-upmade.sql` into a fresh volume with `psql -U postgres -d postgres < ~/pre-upmade.sql`.

## Accepted data losses

These only apply to the domain move (phase 2, or a single-step move), because browser storage belongs to the old origin:

- **Guest work on the current app origin.** Guest documents are never stored on the server, only in the browser's IndexedDB. Signed-in users' documents are on the server and come back once they sign in on app.upmade.io; changes they made offline and never synced stay behind.
- **Old-origin `localStorage` and cookies:** the client's `upmade_*` keys (and their `updraw_*` and `kritzel_*` predecessors), the libraries' settings and the session cookie. Everyone signs in again.
- **Installed PWAs from the old app origin.** Once their service worker unregisters they only lead to the redirect; users reinstall from app.upmade.io.
- On the website and demos: what they keep in the old origin's `localStorage`, such as the stored framework preference and the demo user.
