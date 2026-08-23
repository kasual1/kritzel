---
name: kritzel-angular
description: Build infinite-canvas experiences in Angular with the Kritzel library (kritzel-editor / kritzel-engine web components). Use when adding, configuring, or programmatically driving a Kritzel canvas in an Angular app — creating objects, controlling the viewport, registering tools, theming, workspaces, persistence, or collaboration.
---

# Kritzel in Angular

Kritzel is an infinite-canvas drawing library built with Stencil, consumed in Angular through the `kritzel-angular` wrapper package. It ships two components:

- **`<kritzel-editor>`** — the full experience: canvas + toolbar, workspace manager, settings, context menus, export dialogs. **Default choice.**
- **`<kritzel-engine>`** — the headless canvas only. No UI, **no tools registered by default**. Use when you build your own UI around the canvas.

## Golden rules (always apply)

1. **Setup is one provider + one import.** Add `provideKritzel()` to `app.config.ts` providers and import the `KritzelEditor` (or `KritzelEngine`) proxy component into your standalone component. Do NOT add `CUSTOM_ELEMENTS_SCHEMA` or call `defineCustomElements` yourself — the proxy handles registration.
2. **The host element needs explicit size.** `kritzel-editor { display: block; width: 100%; height: 100vh; }` (or any concrete size). Without it nothing renders.
3. **Wait for readiness before any method call.** Bind `(isReady)` on `kritzel-editor` (or `(isEngineReady)` on `kritzel-engine`) and only call API methods after it fires. Calling earlier fails.
4. **Every API method is async.** Always `await` calls; never fire-and-forget when order matters.
5. **Get the reference via `@ViewChild(KritzelEditor) editor!: KritzelEditor;`** and call methods directly on it (`await this.editor.addObject(...)`). The proxy class exposes all engine methods.
6. **Events are `CustomEvent<T>`; the payload is always in `event.detail`.** Bind with normal Angular syntax: `(objectsChange)="onObjectsChange($event)"`.
7. **Create objects with constructors, position with `translateX`/`translateY` (world coordinates), insert with `addObject`/`addObjects`.** Use `addObjects` for batches (single transaction).
8. **Never mutate an object and expect a re-render.** Change objects through `await editor.updateObject(obj, { ...partial })`.
9. **Colors are theme-aware objects, not strings:** `{ light: '#1f2937', dark: '#f3f4f6' }`.
10. **Camera vs. object:** `setViewport`/`panTo`/`zoomTo` move the *camera*; `centerObjectInViewport` and object updates move *objects*. To focus something without relocating it, use `setViewport(obj.centerX, obj.centerY, scale)`.
11. **Convert pointer coordinates with `screenToWorld(x, y)`** before placing objects at a clicked position.
12. **Discriminate object types via `obj.__class__`** (`'KritzelPath' | 'KritzelText' | 'KritzelShape' | 'KritzelLine' | 'KritzelImage' | 'KritzelGroup'`), e.g. in `findObjects(predicate)`.
13. **Use `ChangeDetectionStrategy.OnPush` + signals.** The proxy detaches change detection; drive your surrounding Angular UI from Kritzel events into signals.
14. **Give every instance a unique `editorId`** when more than one editor can exist (namespaces localStorage/IndexedDB keys).
15. **No persistence by default.** State is lost on reload unless you pass `[syncConfig]` with providers (e.g. `IndexedDBSyncProvider`).

## Minimal working component

```ts
import { ChangeDetectionStrategy, Component, ViewChild, signal } from '@angular/core';
import { KritzelEditor, KritzelText, EditorIsReadyEvent } from 'kritzel-angular';

@Component({
  selector: 'app-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KritzelEditor],
  template: `<kritzel-editor editorId="my-canvas" (isReady)="onReady($event)"></kritzel-editor>`,
  styles: [`kritzel-editor { display: block; width: 100%; height: 100vh; }`],
})
export class CanvasComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;
  readonly isReady = signal(false);

  async onReady(_event: CustomEvent<EditorIsReadyEvent>) {
    this.isReady.set(true);
    const text = new KritzelText({
      text: 'Hello Kritzel!',
      translateX: 0,
      translateY: 0,
      fontSize: 24,
      fontColor: { light: '#000000', dark: '#ffffff' },
    });
    await this.editor.addObject(text);
  }
}
```

And in `app.config.ts`:

```ts
import { provideKritzel } from 'kritzel-angular';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideKritzel()],
};
```

## Reference files (read on demand)

| File | Read when you need… |
|---|---|
| [references/setup.md](references/setup.md) | Installation, app config, editor vs. engine choice, headless engine setup, multi-instance |
| [references/objects.md](references/objects.md) | Creating/updating/removing/querying objects of every type, selection, grouping, z-order, clipboard |
| [references/viewport.md](references/viewport.md) | Pan/zoom, coordinate conversion, boundaries, fitting content, scale limits |
| [references/tools-and-toolbar.md](references/tools-and-toolbar.md) | Switching tools, registering custom/preconfigured tools, customizing the toolbar `toolbarItems` array |
| [references/events.md](references/events.md) | Every event of editor & engine and the Angular binding/signal patterns |
| [references/workspaces-and-persistence.md](references/workspaces-and-persistence.md) | Workspaces, sync providers (IndexedDB/WebSocket/Hocuspocus), collaboration, import/export, screenshots |
| [references/theming-and-context-menus.md](references/theming-and-context-menus.md) | Custom themes, theme-aware colors, global/object context menus |
| [references/recipes.md](references/recipes.md) | End-to-end patterns: image annotation, pin maps, read-only galleries, slide decks, object explorers |
