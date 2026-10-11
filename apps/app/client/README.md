# Client

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.2.2.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Starter workspace

On a user's first visit, the newly initialized workspace contains a centered,
hand-drawn blue (`#4A7DFF`) SVG "Welcome" dynamic object. Existing workspaces and
shared links are not seeded. A per-user localStorage marker records that onboarding
has been handled, independently of canvas contents: deleting the object or creating
another workspace never adds it again. Previously persisted workspace creation
dates also prevent onboarding an existing board on another browser.

The starter object is sized to fit the current viewport (never larger than 100%) and then
centered with `centerObjectInViewport(welcome)`, so it works on small screens such as mobile.
The engine renders an object at `width / scale` world units, so fitting a small viewport
needs a `scale` above 1. The engine's viewport size is re-measured right before sizing.
The SVG viewBox tightly encloses the lettering and its stroke, and the object uses
the same aspect ratio so its selection bounds match the visible content.
Saved Welcome objects using the original padded viewBox are cropped on load,
preserving the lettering's size and position, including scale and rotation.

When the Welcome object is created or loaded, the lettering draws itself over approximately 1.5 seconds,
starting with the W. The animation respects reduced-motion preferences and is
not saved with the object. Reloading replays the reveal without modifying the saved drawing.

The marker follows the same browser-storage lifetime as guest identity. Clearing
site storage resets guest identity and first-visit state.

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Production deployment and stale versions

The editor integration imports from `@kritzel/angular-editor`, including
`provideKritzel` in the application configuration. After upgrading, commit both
`package.json` and `package-lock.json`. The production Docker build uses `npm ci`
to install the locked dependency versions; `.dockerignore` excludes host
dependencies, Angular caches, and previous build output.

The deployment SSH script stops on any failed command. A failed image build must
not proceed to recreate containers using the previous image. Check the client
build output in the GitHub Actions logs, not just the workflow status.

To deploy manually on the server, stop if either command fails:

```bash
set -eu
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d --force-recreate --remove-orphans
```

Run these commands from the repository root on the server. Docker invalidates
the dependency layer when either package manifest changes; disabling the entire
build cache should not normally be necessary.

After a successful deployment, check the app in a fresh private browser session
to distinguish an old server image from an old service-worker-controlled tab.
Close all existing app tabs and reopen the app to use an installed update.
For diagnosis, DevTools' Application > Service Workers > Bypass for network can
temporarily bypass the worker. Avoid clearing all site storage: offline documents
and assets are stored in IndexedDB.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
