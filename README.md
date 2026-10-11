# Developer Guide
Currently this serves as a short guide to remember important concepts and commands that are often used during development. 

The main engine development of the Kritzel library is taking place under "libs/engine/core". Editor and framework-specific package slots live under "libs/editor" and "libs/engine". With every new build Stencil automatically generates wrapper code for the configured output targets, which later may be published to npm. Demo applications for testing can be found under "apps/demos".

## Workflow
The general workflow when working on the library may look as follows:

1. Add or edit engine components and core logic under "libs/engine/core"
2. Build libraries for all configured output targets, namely: Angular, React and Vue
3. Test the libraries of respective output target in the demo applications
4. When a feature is ready and has been tested with the demo applications, bump up the libraries version
5. Publish the library to npm

## Useful Commands
To support the development workflow of "Kritzel" the following commands may be used. All actions should be execute from the root directory. 

1. Install dependencies of the main directory as well as all sub-directories `npm install`
2. Bump up the version of the libraries (Choose what part of the semver version number you want to increase)
	- `npm run bump-patch`
	- `npm run bump-minor`
	- `npm run bump-major`
3. Build the libraries for each output target `npm run build`
4. Use the respective library in one of the demo applications for testing
	-  `npm run start-demo-angular`, 
	-  `npm run start-demo-react`, 
	-  `npm run start-demo-vue`
5. Publish the libraries to npm `npm run publish`
6. Sometimes it's necessary to remove all node_modules and dist folders. Run `npm run clean`

## Showcase App (apps/app)
"apps/app" is the full showcase application (Angular client, NestJS API, Hocuspocus websocket server, Postgres, nginx). It is **not** part of the npm workspaces: each project (`client`, `server/api`, `server/websocket`) has its own `package-lock.json`.

Locally the client uses the kritzel libraries from this repo (`file:` dependencies, installed as copies via `apps/app/client/.npmrc`). The deployment (`.github/workflows/deploy-app.yml`, run manually) swaps them for the **published** npm packages matching the version in `libs/`, builds the client with them and fails if that version is not published or doesn't build.

1. Start the backend services via Docker (requires `apps/app/.env.dev`) `npm run app:dev`
2. Build the libraries and start the client on the host `npm run app:client`, then open http://localhost:8080
3. After changing a library, rebuild it (`npm run build`) and run `npm run app:client:refresh`
4. Stop the backend services `npm run app:stop`

See `apps/app/DOCKER_DEV_COMMANDS.md` for more commands.

## ngrok for Remote Preview
You can expose local dev servers through ngrok to test on mobile devices or share previews.

1. Start the local server you want to share:
	- Stencil library preview: `npm run start`
	- Documentation website: `npm run docs:start`
2. In a second terminal, start ngrok for the same target:
	- Stencil library preview: `npm run ngrok:stencil` (or `npm run ngrok`)
	- Documentation website: `npm run ngrok:website`

Notes:
- `ngrok:stencil` tunnels `http://localhost:3333`
- `ngrok:website` tunnels `http://localhost:3000`
- You can override the target port with `NGROK_PORT`, e.g. `NGROK_PORT=4000 npm run ngrok:website`