# Events & Angular Binding Patterns

All Kritzel events arrive as `CustomEvent<T>` — **the payload is always `event.detail`**. The Angular proxies type their outputs as `EventEmitter<CustomEvent<T>>`, so plain template binding works:

```html
<kritzel-editor
  (isReady)="onReady($event)"
  (objectsChange)="onObjectsChange($event)"
  (viewportChange)="onViewportChange($event)">
</kritzel-editor>
```

```ts
onObjectsChange(e: CustomEvent<KritzelBaseObject[]>) {
  this.objectsCount.set(e.detail.length);
}
```

## `<kritzel-editor>` events

| Event | `detail` type | Fires when |
|---|---|---|
| `isReady` | `EditorIsReadyEvent` | Editor fully initialized — **gate for all API calls**. Contains `host`, `activeWorkspace`, `syncConfig`, `assetStorageConfig`, `loginConfig`, `theme` |
| `activeWorkspaceChange` | `ActiveWorkspaceChangeEvent` (`id`, `name`, `isPublic`, `createdAt`, `updatedAt`) | Active workspace switches |
| `objectsChange` | `KritzelBaseObject[]` | Any add/remove/update (coarse-grained; full current list) |
| `objectsAdded` | `ObjectsAddedEvent` | Objects added (fine-grained) |
| `objectsRemoved` | `ObjectsRemovedEvent` | Objects removed |
| `objectsUpdated` | `ObjectsUpdatedEvent` | Objects updated |
| `undoStateChange` | `KritzelUndoState` | Undo/redo availability changes — drive custom undo/redo buttons |
| `themeChange` | `ThemeName` | Theme switched (settings UI or `theme` prop) |
| `viewportChange` | `KritzelViewportState` | Pan/zoom/resize |
| `isPublicChange` | `IKritzelIsPublicChangeEvent` | Share-state of active workspace toggles |
| `awarenessChange` | `Map<number, Record<string, any>>` | Remote collaborator presence/cursors update |
| `login` / `logout` | `LoginEvent` / `void` | Login dialog interactions (only with `loginConfig`) |

## `<kritzel-engine>` events

Engine emits the same object/viewport/undo/awareness events plus:

| Event | `detail` type | Fires when |
|---|---|---|
| `isEngineReady` | `KritzelEngineState` | Engine ready — gate for engine API calls |
| `activeToolChange` | `KritzelBaseTool` | Active tool switches |
| `objectsSelectionChange` | `void` | Selection set changes — re-query with `getSelectedObjects()` |
| `workspacesChange` | `KritzelWorkspace[]` | Workspace list created/updated/deleted |
| `activeWorkspaceChange` | `KritzelWorkspace` | Active workspace switches (full object, unlike editor) |
| `objectsInViewportChange` | `ObjectsInViewportChangeEvent` | Set of visible objects changes |
| `longpress` | `PointerEvent` | Touch/pen long-press — custom mobile context menus |

## Canonical pattern: events → signals (OnPush)

The proxy components detach Angular change detection. Mirror Kritzel state into signals and let your template read those:

```ts
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KritzelEditor],
  template: `
    <p>{{ statusLine() }}</p>
    <kritzel-editor editorId="demo"
      (isReady)="ready.set(true)"
      (objectsChange)="onObjectsChange($event)"
      (viewportChange)="viewport.set($event.detail)"
      (undoStateChange)="undoState.set($event.detail)">
    </kritzel-editor>
  `,
})
export class DemoComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;
  readonly ready = signal(false);
  readonly objectsCount = signal(0);
  readonly viewport = signal<KritzelViewportState | null>(null);
  readonly undoState = signal<KritzelUndoState | null>(null);

  readonly statusLine = computed(() =>
    this.ready()
      ? `Objects: ${this.objectsCount()} | Zoom: ${this.viewport()?.scale?.toFixed(2) ?? '1.00'}`
      : 'Loading editor…');

  onObjectsChange(e: CustomEvent<KritzelBaseObject[]>) {
    this.objectsCount.set(e.detail.length);
  }
}
```

## Fine-grained sync of an external model (object explorer pattern)

Use the granular triplet instead of `objectsChange` when maintaining your own mirror:

```html
<kritzel-editor
  (objectsAdded)="onAdded($event)"
  (objectsRemoved)="onRemoved($event)"
  (objectsUpdated)="onUpdated($event)">
</kritzel-editor>
```

```ts
onAdded(e: CustomEvent<ObjectsAddedEvent>)     { this.tree.add(e.detail.objects); }
onRemoved(e: CustomEvent<ObjectsRemovedEvent>) { this.tree.remove(e.detail.objects); }
onUpdated(e: CustomEvent<ObjectsUpdatedEvent>) { this.tree.update(e.detail.objects); }
```

## Import sources for event payload types

All common payload types are re-exported by `@kritzel/angular-editor`: `EditorIsReadyEvent`, `ActiveWorkspaceChangeEvent`, `ObjectsAddedEvent`, `ObjectsRemovedEvent`, `ObjectsUpdatedEvent`, `ObjectsInViewportChangeEvent`, `KritzelViewportState`, `KritzelUndoState`, `KritzelEngineState`, `KritzelDebugInfo`, `IKritzelUser`, `LoginEvent`, `ThemeName`. Import them from `@kritzel/angular-editor`, not `@kritzel/engine` unless you are intentionally building against the engine package directly.

## Rules

- Treat `isReady` / `isEngineReady` as the start-of-life signal; sequence all seeding inside its handler.
- Handlers may be async and call back into the editor (e.g. re-query selection on `objectsSelectionChange`).
- Don't deep-store live `KritzelBaseObject` references for long; re-fetch by `id` when acting later (objects can be replaced by sync/undo).
- These are events, not banana-boxes: there is no two-way binding. To set state, use inputs (`[theme]`, `[activeWorkspaceId]`) and update your bound value inside the matching change event.
