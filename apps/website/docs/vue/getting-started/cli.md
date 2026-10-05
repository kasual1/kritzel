---
sidebar_label: CLI Setup
title: "CLI Setup | Kritzel for Vue"
description: "Install Kritzel in an existing Vue application and optionally generate a TypeScript canvas component."
toc_max_heading_level: 2
---

# CLI Setup

The optional `@kritzel/cli` development tool installs Kritzel into an existing Vue application. **Installation is the default; generation requires `--generate-component`.** Direct installation in [Quick Start](./quick-start.md) remains supported.

## Requirements

Use Node.js 22 or newer and an installed npm, pnpm, or Yarn (Classic or modern) on Windows, macOS, or Linux. Your existing Vue version must satisfy the selected Kritzel release's published peers. Generation needs TypeScript configuration and SFC tooling in a supported Vue application; no framework upgrades or new application scaffolding are performed.

JavaScript and SSR/meta-framework projects can use installation-only mode. Generic component generation does not configure SSR and is not supported for recognized SSR/meta-framework layouts such as Nuxt.

## Install dependencies

Run inside your application:

```bash
npx @kritzel/cli@latest init --framework vue --component editor
```

The editor includes built-in UI and tools. For a lower-level canvas with your own UI, choose engine:

```bash
npx @kritzel/cli@latest init --framework vue --component engine
```

Editor installs `@kritzel/vue-editor`, `@kritzel/editor`, and `@kritzel/engine`; engine installs `@kritzel/vue-engine` and `@kritzel/engine`, without the editor. Known required peers `yjs`, `lib0`, `y-indexeddb`, and `y-websocket` are checked and added explicitly when missing. The CLI itself is not installed as an application runtime dependency.

The CLI detects framework and manager when options are omitted. Interactive mode explains the editor/engine choice. Unattended runs default to editor but require an unambiguous application and framework.

## Generate a starter

```bash
npx @kritzel/cli@latest init --framework vue --component editor --generate-component
```

Use `--component engine` for the engine starter. Both starters use TypeScript SFCs, have explicit sizing, and create new files only. By default, a conventional Vue layout receives `src/components/kritzel-canvas/KritzelCanvas.vue`. For other layouts, pass `--output`.

### Manual integration

The CLI prints the remaining steps; it does **not** modify application components, routes, global styles, or HTML.

Import and mount the generated component:

```html title="App.vue"
<script setup lang="ts">
import KritzelCanvas from './components/kritzel-canvas/KritzelCanvas.vue'
</script>

<template>
  <KritzelCanvas />
</template>
```

Adjust the path for your mounting component and give each instance a distinct starter ID when mounting multiple canvases. No Angular-style provider registration is needed.

The generated editor starter renders `<KritzelEditor>`; engine mode uses `<KritzelEngine>` and registers/activates a drawing tool after readiness. Vue template refs are component instances; when extending the starter, use `getEditorRef()` from `@kritzel/vue-editor` or `getEngineRef()` from `@kritzel/vue-engine` to access the native API.

See [Tools](../fundamentals/tools.md) and the [Engine API](../api-reference/engine.md) when extending it. Installation-only users can follow [Quick Start](./quick-start.md) for editor setup or the Engine API for engine setup.

## Workspaces and unattended runs

Target the application directory explicitly:

```bash
npx @kritzel/cli@latest init --cwd ./apps/board --framework vue --component editor --package-manager pnpm --generate-component --output src/components/kritzel-canvas --yes
```

Dependencies are added to the selected app, not the workspace root; the owning manager updates the shared lockfile. Starting at a workspace root with multiple apps requires a prompt or an app-specific `--cwd`. Conflicting manager declarations/lockfiles must be resolved rather than silently creating another lockfile.

`--yes` suppresses confirmation and accepts safe defaults. It never guesses ambiguous apps/frameworks or allows overwrites.

## Options and versions

| Option | Meaning |
| --- | --- |
| `--framework angular\|react\|vue` | Framework matching the application's dependencies. |
| `--component editor\|engine` | Full UI or lower-level canvas. |
| `--package-manager npm\|pnpm\|yarn` | Manager consistent with workspace configuration. |
| `--cwd <directory>` | Application/workspace discovery starting point. |
| `--generate-component` | Opt in to TypeScript generation. |
| `--output <directory>` | Output relative to the app; requires generation. |
| `--kritzel-version <exact-version>` | Exact stable Kritzel release, for example `0.5.2`. |
| `--yes` | Unattended confirmation with safe, unambiguous defaults. |
| `--help`, `--version` | Metadata without discovery, installation, or network access. |

The CLI releases in lockstep with the engine/editor packages and wrappers. By default it installs its own release version; `@latest` does not independently select each dependency's latest version. An override must be an exact stable version, not a range, tag, prerelease, URL, or file spec. Compatible existing third-party peers are preserved.

## Safety and recovery

There is no overwrite/force flag or dry-run mode. Existing output files fail preflight before dependency installation; choose another output directory or remove the conflict yourself.

If installation fails or is interrupted, inspect manager output and manifest/lockfile changes before retrying. The CLI does not broadly roll back manager-owned changes and does not generate a starter after failed installation. If generation fails after installation, dependencies remain installed; inspect the reported generated paths before retrying.

Missing releases, incompatible peers, unsupported layouts, and registry failures are reported with recovery guidance. Exit codes: `0` for success, `1` for failure, `130` for cancellation.

For Yarn Classic workspace targeting, the selected app's `package.json` needs a workspace `name` and a valid `version`. Add or correct these manually if preflight rejects the app; the CLI does not rewrite workspace metadata.

Yarn Classic workspace installation also runs `yarn install --check-files` at the workspace root to restore/check hoisted dependencies; only manager-owned installation artifacts and potentially the lockfile are affected. For a modern Yarn project-boundary error, give an intentionally isolated nested project its own `yarn.lock`, or target a declared workspace of the owning project.
