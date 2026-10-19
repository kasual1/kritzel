# @kritzel/cli

Install Kritzel into an **existing** Angular, React, or Vue application. The `kritzel` binary installs dependencies by default; starter component generation is a separate opt-in. The CLI is a development tool, not an application runtime dependency.

## Requirements

- Node.js 22 or newer on Windows, macOS, or Linux.
- An existing application with a `package.json` and a supported Angular, React, or Vue version compatible with the selected Kritzel release's published peers.
- npm, pnpm, or Yarn (Classic or modern) already installed. Bun is not supported.
- TypeScript tooling/configuration for component generation; Vue generation also requires TypeScript SFC support.

The CLI does not scaffold applications, upgrade frameworks, or configure SSR. Installation-only mode can be used in JavaScript or SSR/meta-framework applications; generic starter generation is not supported for SSR/meta-frameworks such as Next.js and Nuxt.

## Install dependencies

Run inside your application:

```bash
npx @kritzel/cli@latest init
```

The CLI detects the framework and owning package manager and recommends the editor, which includes UI and tools. The engine is the lower-level canvas for custom UI and registered tools. Ambiguous choices are prompted interactively.

```bash
npx @kritzel/cli@latest init --framework react --component editor
npx @kritzel/cli@latest init --framework vue --component engine --yes
```

Neither command creates a component. Direct package installation remains supported; see the [Angular](https://kritzel.io/docs/angular/getting-started/quick-start), [React](https://kritzel.io/docs/react/getting-started/quick-start), and [Vue](https://kritzel.io/docs/vue/getting-started/quick-start) quick starts.

## Generate a TypeScript starter

```bash
npx @kritzel/cli@latest init --framework angular --component editor --generate-component
npx @kritzel/cli@latest init --framework react --component engine --generate-component
npx @kritzel/cli@latest init --framework vue --component editor --generate-component
```

All six framework/component combinations are supported. The generated component has concrete canvas sizing; engine starters register and activate a drawing tool. Generation creates **new files only**. No application source, routes, providers, styles, or HTML are rewritten.

| Framework | Default output directory | Starter |
| --- | --- | --- |
| Angular | `src/app/kritzel-canvas` | `kritzel-canvas.component.ts` (`KritzelCanvasComponent`) |
| React | `src/components/kritzel-canvas` | `KritzelCanvas.tsx` (`KritzelCanvas`) |
| Vue | `src/components/kritzel-canvas` | `KritzelCanvas.vue` |

Defaults require a recognizable source layout. Otherwise, specify `--output`.

Follow the printed manual integration steps: Angular needs `provideKritzel()` from the selected wrapper in application providers and the standalone component imported/mounted; React and Vue need the generated component imported/rendered in your app. Use distinct starter IDs before mounting multiple canvas instances. For engine integrations, see the framework's engine API and tools documentation, not editor setup instructions.

## Options

| Option | Purpose |
| --- | --- |
| `--framework angular\|react\|vue` | Choose the framework; must match application dependencies. |
| `--component editor\|engine` | Choose full editor UI or the low-level engine. |
| `--package-manager npm\|pnpm\|yarn` | Choose the manager, consistent with the owning workspace. |
| `--cwd <directory>` | Start discovery at this application/workspace directory. Defaults to the current directory. |
| `--generate-component` | Opt in to TypeScript starter generation. |
| `--output <directory>` | Output relative to the selected application; requires `--generate-component`. |
| `--kritzel-version <exact-version>` | Select an exact stable Kritzel release, for example `0.5.2`. Ranges, tags, prereleases, URLs, and file specs are rejected. |
| `--yes` | Suppress confirmation and accept safe, unambiguous defaults; never authorize overwrites or guess an ambiguous app/framework. |
| `--help`, `--version` | Show metadata without installation, discovery, or network access. |

There is no overwrite/force option or dry-run mode. In unattended/non-TTY runs, editor is the default; ambiguous application or framework selection fails with guidance rather than waiting for input.

## Workspaces

Target a specific application, not the workspace root:

```bash
npx @kritzel/cli@latest init --cwd ./apps/board --framework angular --component editor --package-manager pnpm --generate-component --output src/app/kritzel-canvas --yes
```

Discovery supports npm/Yarn workspace declarations and pnpm workspaces. Starting in a leaf app keeps that app selected; the workspace supplies manager configuration and lockfile ownership. Starting at a root with multiple supported apps requires interactive selection or an app-specific `--cwd`. Dependency changes target the app's runtime dependencies while the owning manager updates the shared lockfile.

Conflicting manager declarations/lockfiles are errors; the CLI never silently creates a second manager's lockfile. It honors the selected manager's registry and authentication settings.

After Yarn Classic adds workspace dependencies, the CLI runs `yarn install --check-files` at the workspace root to restore/check hoisted dependencies. This affects manager-owned installation artifacts and potentially the lockfile, not application source.

## Package and version policy

| Framework | Editor installation | Engine installation |
| --- | --- | --- |
| Angular | `@kritzel/angular-editor`, `@kritzel/editor`, `@kritzel/engine` | `@kritzel/angular-engine`, `@kritzel/engine` |
| React | `@kritzel/react-editor`, `@kritzel/editor`, `@kritzel/engine` | `@kritzel/react-engine`, `@kritzel/engine` |
| Vue | `@kritzel/vue-editor`, `@kritzel/editor`, `@kritzel/engine` | `@kritzel/vue-engine`, `@kritzel/engine` |

CLI, engine, editor, and wrappers release together. Unless overridden, the CLI selects **its own packaged release version**, not each package's independently resolved latest version. Selected Kritzel packages use the same exact release. Known required peers `yjs`, `lib0`, `y-indexeddb`, and `y-websocket` are checked and added explicitly when missing; compatible existing third-party peers are preserved. Engine mode does not install the editor. The CLI itself is never added to application runtime dependencies.

## Recovering from errors

- **Ambiguous app/framework:** pass an app-specific `--cwd` and `--framework`.
- **Conflicting package manager:** resolve the application's/workspace's declarations and lockfiles; select the matching manager.
- **Yarn Classic workspace target rejected:** ensure the selected application's `package.json` has a workspace `name` and a valid `version`. Add or correct these manually; the CLI does not rewrite workspace metadata.
- **Modern Yarn project boundary error:** an intentionally isolated project nested inside another Yarn project needs its own `yarn.lock`; otherwise, target a declared workspace of the owning project. Follow the reported native manager guidance.
- **Unsupported framework/peer version:** use a compatible published release or integrate manually. The CLI does not upgrade your framework.
- **Missing package release or registry failure:** check the exact release and manager registry/authentication, then retry.
- **Existing output file:** choose another `--output` or remove the conflicting file yourself. Conflicts fail before installation; `--yes` does not bypass protection.
- **Install failure/interruption:** inspect manager output and the app manifest/shared lockfile. The manager may already have changed them; the CLI does not attempt broad rollback. No starter is generated after failed installation.
- **Generation failure after installation:** dependencies remain installed. Inspect the reported generated paths and fix permissions/output conflicts before retrying.

Exit codes are `0` for success, `1` for validation/installation/generation failure, and `130` for cancellation.

## Source and license

The CLI source is available in [`libs/cli` in the public repository](https://github.com/kasual1/kritzel/tree/main/libs/cli). The package is licensed under the [MIT License](./LICENSE).
