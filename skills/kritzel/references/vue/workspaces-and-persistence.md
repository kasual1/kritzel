# Workspaces, Persistence, Collaboration, Import/Export

## Workspaces

A workspace is a complete document: its objects, view state, and metadata. The editor always has one active workspace (one is created automatically on first run).

```ts
import { getEditorRef, KritzelWorkspace } from '@kritzel/vue-editor';

const editor = getEditorRef('editor'); // top level of <script setup>; 'editor' = template ref name

const workspaces = await editor.value?.getWorkspaces();
const active = await editor.value?.getActiveWorkspace();

// Create — constructor takes (id, name)
const ws = new KritzelWorkspace(crypto.randomUUID(), 'Board 2');
await editor.value?.createWorkspace(ws);

await editor.value?.updateWorkspace(ws);  // rename etc. (mutate metadata, then update)
await editor.value?.deleteWorkspace(ws);
```

### Switching workspaces (controlled pattern)

Drive the active workspace via the `:activeWorkspaceId` prop backed by a `ref`, and mirror changes back from the event:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { KritzelEditor, type ActiveWorkspaceChangeEvent, type KritzelWorkspace } from '@kritzel/vue-editor';

const activeWorkspaceId = ref<string | undefined>(undefined);

function onReady(event: CustomEvent<{ activeWorkspace: KritzelWorkspace }>) {
  activeWorkspaceId.value = event.detail.activeWorkspace.id;
}

function onActiveWorkspaceChange(event: CustomEvent<ActiveWorkspaceChangeEvent>) {
  activeWorkspaceId.value = event.detail.id;
}
</script>

<template>
  <KritzelEditor
    ref="editor"
    :activeWorkspaceId="activeWorkspaceId"
    @isReady="onReady"
    @activeWorkspaceChange="onActiveWorkspaceChange"
  />
</template>
```

Your own workspace switcher buttons just set `activeWorkspaceId.value = ws.id` — the prop change activates the workspace. Keep a `workspaces = ref<KritzelWorkspace[]>([])` mirror and refresh it from `getWorkspaces()` after create/delete (the `@workspacesChange` event also fires when the collection changes). The built-in workspace manager UI handles all of this; hide it with `:isWorkspaceManagerVisible="false"` if you build your own.

## Persistence & sync providers

Kritzel state lives in a Yjs document; sync providers decide where it goes. **Default is `{ providers: [] }` — nothing persists across reloads.**

```vue
<script setup lang="ts">
import { KritzelEditor, IndexedDBSyncProvider, type KritzelSyncConfig } from '@kritzel/vue-editor';

const syncConfig: KritzelSyncConfig = {
  providers: [IndexedDBSyncProvider],   // local persistence, restored on reload
};
</script>

<template>
  <KritzelEditor ref="editor" editorId="my-board" :syncConfig="syncConfig" />
</template>
```

**Always define `syncConfig` as a const in `<script setup>` (or module scope)** — never inline an object literal in the template, which would create a new object every render and churn the prop on the web component.

Available providers (all exported from `@kritzel/vue-editor`):

| Provider | Persists/Syncs to | Use |
|---|---|---|
| `InMemorySyncProvider` | memory only | Explicit "no persistence" |
| `IndexedDBSyncProvider` | browser IndexedDB | Local persistence / offline |
| `BroadcastSyncProvider` | BroadcastChannel | Sync across tabs on the same device |
| `WebSocketSyncProvider.with({ url, roomName })` | y-websocket server | Real-time network sync |
| `HocuspocusSyncProvider.with({ url, name, token })` | Hocuspocus server | Real-time sync with auth; `token` may be a string or (async) function |

Providers are additive — combine for offline + realtime:

```ts
const syncConfig: KritzelSyncConfig = {
  providers: [
    IndexedDBSyncProvider,
    HocuspocusSyncProvider.with({ url: 'wss://collab.example.com', token: () => auth.getToken() }),
  ],
};
```

If you change `syncConfig` after init (e.g. after login), call `await editor.value?.reinitSync()` to tear down and reconnect.

## Collaboration extras

- Pass the current user for presence: `:user="currentUser"` with `IKritzelUser` shape `{ id, displayName?, firstName?, lastName?, email?, profileImageUrl?, color?, isGuest? }`; show others via `activeUsers`. The editor treats `isGuest: true` (or no user) as logged out.
- Live remote cursors/presence arrive on `@awarenessChange` → `(event as CustomEvent<Map<number, Record<string, any>>>).detail`.
- Shared/public workspaces: `await editor.value?.loadSharedWorkspace(token)`; observe `@isPublicChange`.
- Image/file binaries are stored via the `:assetStorageConfig` prop; default is IndexedDB-backed. HTTP/presigned-URL providers exist for server storage.

## Import / Export

```ts
// JSON round-trip
await editor.value?.downloadAsJson('board.json');          // download file
await editor.value?.importFromFile();                      // open file picker, import
const n = await editor.value?.loadObjectsFromJson(json);   // merge objects into CURRENT workspace; returns count

// Engine-only granular APIs (engine = getEngineRef('engine')):
const json = await engine.value?.exportAsJson();           // serialize active workspace
await engine.value?.importFromJson(json);                  // import as a NEW workspace and switch to it

// Images
const dataUrl = await editor.value?.getScreenshot('png'); // data URL or null
await editor.value?.exportViewportAsPng();  // triggers download
await editor.value?.exportViewportAsSvg();
```

## Rules

- Decide persistence **up front** via `syncConfig`; don't rely on the default (none).
- One IndexedDB namespace per `editorId` — distinct ids keep boards separate, a shared id makes two views of the same board.
- With persistence enabled, `@isReady` fires with restored content — **guard seeding**: `if ((await editor.value?.getAllObjects())?.length === 0) await seed(editor.value!);`.
- `loadObjectsFromJson` merges into the current workspace; `importFromJson` creates a new one. Pick deliberately.
- Treat tokens as functions (`token: () => Promise<string>`) so reconnects always get a fresh credential.
- `getEditorRef`/`getEngineRef` must be called at the top level of `<script setup>` (they use `useTemplateRef` internally); the argument is the template-ref **name** string, and every API call on the resolved element must be awaited.
