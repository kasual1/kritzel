# Rebrand cutover: kritzel.io → updraw.io

One-time runbook for moving production from Kritzel (kritzel.io, app.kritzel.io, `@kritzel/*`, `~/kritzel-app`, database `kritzel`) to Updraw (updraw.io, app.updraw.io, `@updraw/*`, `~/updraw-app`, database `updraw`).

Do the steps in order. `gh` commands run from a clone of the repository; `docker` commands run on the Lightsail instance.

| # | Step | When | Downtime |
|---|------|------|----------|
| 1 | [Prerequisites](#1-before-merging) | Before merging the rebrand | No |
| 2 | [Publish the libraries](#2-after-merging-publish-the-libraries) | Right after merging | No |
| 3 | [Lightsail maintenance window](#3-lightsail-maintenance-window) | After step 2 | Yes, until step 4 |
| 4 | [Deploy](#4-deploy) | Right after step 3 | Ends here |
| 5 | [Old hosts](#5-old-hosts) | After step 4 is verified | No |
| 6 | [Afterwards](#6-afterwards) | Following days | No |

> [!WARNING]
> After the merge, `deploy-app` deploys to `~/updraw-app`. Don't run it before step 3 has created that directory: it would start a second, unconfigured stack next to the running one.

## 1. Before merging

### npm

1. Create the `updraw` organization on npmjs.com, owned by the account that owns the `@kritzel` packages.
2. Create a granular access token with read and write access to the `@updraw` scope.
3. Check the token and store it as the `NPM_TOKEN` repository secret (used by `deploy-libs`):

```bash
read -rs NPM_TOKEN                      # paste the new token
npmrc=$(mktemp)
printf '//registry.npmjs.org/:_authToken=%s\n' "$NPM_TOKEN" > "$npmrc"
npm whoami --userconfig "$npmrc"                            # the publishing account
npm access list packages @updraw --userconfig "$npmrc"      # empty before the first publish; an error means no access
gh secret set NPM_TOKEN <<< "$NPM_TOKEN"
rm "$npmrc"; unset NPM_TOKEN
```

### Rollback tag

Tag the last commit before the merge, so the old app can be redeployed (see [Rollback](#rollback)):

```bash
git fetch origin
git tag pre-updraw origin/main
git push origin pre-updraw
```

### DNS and TLS (Cloudflare)

- In the updraw.io zone, point `app.updraw.io` at the Lightsail static IP (the same address as `app.kritzel.io`), proxied.
- Use the same SSL/TLS encryption mode as the kritzel.io zone. The origin's nginx only listens on :80, so a mode that connects to the origin over HTTPS fails. Copy "Always Use HTTPS" and keep WebSockets enabled.

nginx answers for any host name, so the current (old) app is already reachable on the new name. Check it with curl only; don't use the app on app.updraw.io before the cutover.

```bash
dig +short app.updraw.io
curl -sS https://app.updraw.io/api/config      # JSON from the running api
```

### Cloudflare Pages

Add `updraw.io` (and `www.updraw.io` if used) as a custom domain of the existing Pages project (`CLOUDFLARE_PAGES_PROJECT_NAME`). Keep the kritzel.io domains attached for now.

```bash
curl -sI https://updraw.io/ | head -n 1        # 200
```

### Google OAuth (Google Cloud console, APIs & Services)

- OAuth consent screen: add `updraw.io` to the authorized domains, and update the app name, home page, privacy policy and terms links. Branding changes can need re-verification, so do this early.
- OAuth client: add the redirect URI `https://app.updraw.io/api/auth/google/callback`. If JavaScript origins are set, add `https://app.updraw.io`. Keep the app.kritzel.io entries until the rollback window is over.

### Cloudflare R2

- Add `https://app.updraw.io` to the bucket's CORS allowed origins. Keep `https://app.kritzel.io` until the cutover is verified.
- Keep `R2_PUBLIC_BASE_URL` as it is: stored documents contain absolute asset URLs. If that host is on the kritzel.io zone, it must keep working: leave it out of the redirects in step 5, and keep the domain.

## 2. After merging: publish the libraries

Run `deploy-libs` with a **minor** bump (0.6.x → 0.7.0; the rename is a breaking change). `deploy-app` refuses to run until the `@updraw/*` packages for the current version are on npm.

```bash
gh workflow run deploy-libs.yml -f bump=minor
gh run watch
```

Check every package once the run has finished:

```bash
git pull
VERSION=$(node -p "require('./libs/editor/core/package.json').version")
for pkg in core engine editor angular-engine angular-editor react-engine react-editor vue-engine vue-editor; do
  echo "@updraw/$pkg: $(npm view "@updraw/$pkg@$VERSION" version)"
done
```

## 3. Lightsail maintenance window

The app is down from `down` until `deploy-app` has finished (step 4).

```bash
cd ~/kritzel-app
docker compose -f docker-compose.prod.yml exec -T postgres pg_dumpall -U postgres > ~/pre-updraw.sql
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -l   # confirm the real DB name
docker compose -f docker-compose.prod.yml down          # no -v
test ! -e ~/updraw-app                                   # must not exist, or mv would nest the directory
mv ~/kritzel-app ~/updraw-app && cd ~/updraw-app
docker compose -f docker-compose.prod.yml create postgres
docker volume inspect kritzel-app_pgdata_prod > /dev/null   # fails if the old volume has another name
docker run --rm -v kritzel-app_pgdata_prod:/from:ro -v updraw-app_pgdata_prod:/to alpine sh -c 'cp -a /from/. /to/'
docker compose -f docker-compose.prod.yml up -d postgres
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d postgres -c 'ALTER DATABASE kritzel RENAME TO updraw'
```

- If `psql -l` shows another database name than `kritzel` (compare `DATABASE_URL` in `.env`), use that name in `ALTER DATABASE`.
- Run `down` **before** `mv`. The server's compose file has no `name:` yet, so the project name comes from the directory; after the move, compose no longer finds the running `kritzel-app` containers.
- Never use `down -v`: it deletes the database volume.
- If `test ! -e ~/updraw-app` fails, `deploy-app` already ran and created the directory: move it aside (`mv ~/updraw-app ~/updraw-app.early`) and continue. If `docker volume inspect` fails, look up the real volume name with `docker volume ls` and use it in the copy; `docker run -v` would otherwise create an empty volume and copy nothing.
- `create postgres` creates the empty `updraw-app_pgdata_prod` volume without starting Postgres, so `init.sql` never runs on it. The old `kritzel-app_pgdata_prod` volume is only read, and stays as the rollback copy.

Check the result:

```bash
grep -c 'database cluster dump complete' ~/pre-updraw.sql                       # 1
docker volume ls | grep pgdata_prod                                              # both volumes
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -l   # updraw, no kritzel
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d updraw -c 'SELECT count(*) FROM documents'
```

Then back up and edit `.env`. Change only these three values:

| Variable | New value |
|----------|-----------|
| `DATABASE_URL` | Same URL with the database name `updraw`, e.g. `postgresql://postgres:<password>@postgres:5432/updraw` |
| `CLIENT_URL` | `https://app.updraw.io` |
| `GOOGLE_CALLBACK_URL` | `https://app.updraw.io/api/auth/google/callback` |

```bash
cp .env .env.pre-updraw
vi .env
grep -E '^(DATABASE_URL|CLIENT_URL|GOOGLE_CALLBACK_URL)=' .env
```

Leave `R2_*` (including `R2_PUBLIC_BASE_URL`), `JWT_SECRET`, `GOOGLE_CLIENT_*`, `API_URL` and `POSTGRES_PASSWORD` unchanged.

## 4. Deploy

```bash
gh workflow run deploy-app.yml
```

What happens on the server:

- `docker-compose.prod.yml` now sets `name: updraw-app`, so the stack keeps using `updraw-app_pgdata_prod` whatever the directory is called.
- On startup the api runs the TypeORM migration `RenameLegacyBrandDocumentIds`, in one transaction:
  - every `kritzel-*` document id becomes `updraw-*`;
  - if both ids exist and belong to the same user (e.g. a fallback document a new client created), the Yjs states are merged into one row that keeps the original (legacy) row's owner, visibility and type;
  - if both ids exist but the `updraw-*` row belongs to someone else (document ids appear in share links), that row is set aside as `rename-conflict-updraw-*` and the original document takes the id; the api log names every such row;
  - legacy `Kritzel*` class names inside the documents are renamed to `Updraw*`.
- The websocket service waits until the api's healthcheck passes, so no client connects while the migration runs. If the migration fails, the api never gets healthy and the deploy fails before websocket starts.
- The websocket server rejects legacy `kritzel-*` document names from stale clients, so they can't create rows under the old names.

Check the deploy:

```bash
cd ~/updraw-app
docker compose -f docker-compose.prod.yml ps                                      # api healthy, all services running
docker compose -f docker-compose.prod.yml logs api | grep RenameLegacyBrandDocumentIds   # no output = nothing was skipped
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d updraw \
  -c "SELECT count(*) FILTER (WHERE id LIKE 'kritzel-%') AS legacy, count(*) AS total FROM documents"
```

`legacy` must be 0. A remaining row could not be merged; the api log names it, and its data is still in the row.

Sign in on https://app.updraw.io and open a few existing workspaces, including one with images (checks R2 CORS).

Then deploy the website and the demos:

```bash
gh workflow run deploy-website.yml
gh workflow run deploy-demos.yml
```

## 5. Old hosts

In the kritzel.io zone, add redirect rules (Rules → Redirect Rules), status 301, with "Preserve query string" on:

| Matches | Target URL (dynamic) |
|---------|----------------------|
| `(http.host in {"kritzel.io" "www.kritzel.io"})` | `concat("https://updraw.io", http.request.uri.path)` |
| `(http.host eq "app.kritzel.io" and http.request.uri.path ne "/ngsw.json")` | `concat("https://app.updraw.io", http.request.uri.path)` |

Match host names only, never the whole zone, so the R2 asset host keeps working if it is on this zone.

`app.kritzel.io/ngsw.json` must return **404**. On a 404 the Angular service worker deletes its caches and unregisters itself. A redirected `ngsw.json` looks like a network error to it, and it keeps serving the cached old app. For example, add a Worker on the route `app.kritzel.io/ngsw.json*`:

```js
export default {
  fetch: () => new Response('Not found', { status: 404, headers: { 'cache-control': 'no-store' } }),
};
```

`app.kritzel.io` still resolves to the Lightsail instance, so `/api` and `/ws` on the old host must not reach the backend anymore. Check:

```bash
curl -sI 'https://app.kritzel.io/some-workspace?share=true' | grep -iE '^(HTTP|location)'   # 301 to app.updraw.io, same path and query
curl -sI https://app.kritzel.io/api/config | grep -iE '^(HTTP|location)'                     # 301, not 200
curl -si --http1.1 -H 'Connection: Upgrade' -H 'Upgrade: websocket' -H 'Sec-WebSocket-Version: 13' \
  -H 'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==' https://app.kritzel.io/ws | head -n 1      # 301, never 101
curl -sI https://app.kritzel.io/ngsw.json | head -n 1                                         # 404
curl -sI 'https://kritzel.io/docs/?ref=x' | grep -iE '^(HTTP|location)'                       # 301 to updraw.io, same path and query
```

## 6. Afterwards

- **Umami:** change the website's domain to updraw.io (same website id, see `apps/website/docusaurus.config.ts`).
- **Search Console:** verify updraw.io (domain property), submit `https://updraw.io/sitemap.xml`, then use "Change of address" on the kritzel.io property.
- **npm:** deprecate the old packages (needs an owner of `@kritzel`; add `--otp=<code>` if 2FA asks for it):

```bash
for pkg in core engine editor angular-engine angular-editor react-engine react-editor vue-engine vue-editor; do
  npm deprecate "@kritzel/$pkg" "Renamed to @updraw/$pkg"
done
```

- **Keep the old data until the cutover is verified** (e.g. two weeks): the `kritzel-app_pgdata_prod` volume, `~/pre-updraw.sql` and `~/updraw-app/.env.pre-updraw`. Then remove them, and the app.kritzel.io entries in Google OAuth and R2 CORS:

```bash
docker volume rm kritzel-app_pgdata_prod
rm ~/pre-updraw.sql ~/updraw-app/.env.pre-updraw
```

- Keep kritzel.io registered: it serves the redirects (and the assets, if `R2_PUBLIC_BASE_URL` is on it).

## Rollback

The old volume still holds the database `kritzel` as it was before step 3. Changes made after the cutover are only in `updraw-app_pgdata_prod` and are not carried back.

**Before `deploy-app` ran** (the server still has the old compose files):

```bash
docker compose -p updraw-app down             # no -v
mv ~/updraw-app ~/kritzel-app && cd ~/kritzel-app
cp .env.pre-updraw .env                       # only if .env was already edited
docker compose -f docker-compose.prod.yml up -d
```

**After `deploy-app` ran:** start from a clean directory. `scp` doesn't delete files, so the new api migration would otherwise be built into the old app and rename the documents again.

```bash
docker compose -p updraw-app down             # no -v
mv ~/updraw-app ~/updraw-app.rolled-back
mkdir ~/kritzel-app
cp ~/updraw-app.rolled-back/.env.pre-updraw ~/kritzel-app/.env
```

Then redeploy the old ref, which deploys to `~/kritzel-app` with the old compose project and volume:

```bash
gh workflow run deploy-app.yml --ref pre-updraw
```

If the `app-prod` environment only allows deployments from `main`, allow the `pre-updraw` tag in its deployment branch and tag rules first (repository settings, Environments). Note that the migration's `down()` only renames the ids back; the class names stay `Updraw*`, which the old app cannot read, so roll back from the old volume as above, never with `migration:revert`.

Finally, disable the redirect rules and the `ngsw.json` Worker from step 5. Last resort if a volume is damaged: restore `~/pre-updraw.sql` into a fresh volume with `psql -U postgres -d postgres < ~/pre-updraw.sql`.

## Accepted data losses

These can't follow the domain move, because browser storage belongs to the old origin:

- **Guest work on app.kritzel.io.** Guest documents are never stored on the server, only in the browser's IndexedDB. Signed-in users' documents are on the server and come back once they sign in on app.updraw.io.
- **Old-origin `localStorage` and cookies:** `kritzel_user`, `kritzel_guest_user`, `kritzel_public_config`, `kritzel_welcome_initialized:*` and the session cookie. Everyone signs in again.
- **Installed PWAs from app.kritzel.io.** Once their service worker unregisters they only lead to the redirect; users reinstall from app.updraw.io.
- On the website and demos: the stored framework preference (`kritzel-preferred-framework`) and the demo user (`kritzel_user`).
