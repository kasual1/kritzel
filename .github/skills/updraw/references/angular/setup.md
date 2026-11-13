# Setup & Component Choice

## Installation

```bash
npm install @updraw/angular-editor
```

`@updraw/angular-editor` wraps the core `@updraw/engine` web components in typed Angular standalone proxy components and re-exports all classes/types you need â€” import everything from `@updraw/angular-editor`, or from `@updraw/engine` when intentionally building an engine-only integration.

## Application config

```ts
// app.config.ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideUpdraw } from '@updraw/angular-editor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideUpdraw(), // registers the custom elements once
  ],
};
```

## Global sizing CSS

The editor fills its host; the host must have a concrete size. For a full-page canvas:

```css
/* styles.css */
html, body, app-root {
  width: 100dvw;
  height: 100dvh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  display: block;
}
```

```css
updraw-editor { display: block; width: 100%; height: 100%; }
```

For mobile, add to `index.html`:

```html
<meta name="viewport" content="viewport-fit=cover, width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0, minimum-scale=1.0, interactive-widget=resizes-content" />
```

## Editor vs. Engine â€” decision rule

| | `<updraw-editor>` (UpdrawEditor) | `<updraw-engine>` (UpdrawEngine) |
|---|---|---|
| Toolbar, settings, workspace manager, export UI | âœ… built in (each part hideable) | âŒ none |
| Tools registered by default | âœ… selection, brush, eraser, line, shape, text, image | âŒ **none â€” you must `registerTool` yourself** |
| Readiness event | `(isReady)` â†’ `CustomEvent<EditorIsReadyEvent>` | `(isEngineReady)` â†’ `CustomEvent<UpdrawEngineState>` |
| Programmatic object/viewport API | âœ… full (delegates to engine) | âœ… full |
| Typical use | Default. Hide pieces via `[isToolbarVisible]`, `[isMoreMenuVisible]`, `[isWorkspaceManagerVisible]`, `[isUtilityPanelVisible]` | Fully custom UI around a bare canvas |

**Prefer hiding editor UI over dropping to the engine.** A "chrome-less" editor still gives you context menus, shortcuts and tool plumbing:

```html
<updraw-editor
  editorId="embedded"
  [isToolbarVisible]="false"
  [isMoreMenuVisible]="false"
  [isWorkspaceManagerVisible]="false"
  [isUtilityPanelVisible]="false"
  (isReady)="onReady($event)">
</updraw-editor>
```

## Component skeleton (editor)

```ts
import { ChangeDetectionStrategy, Component, ViewChild, signal } from '@angular/core';
import { UpdrawEditor, EditorIsReadyEvent } from '@updraw/angular-editor';

@Component({
  selector: 'app-board',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UpdrawEditor],
  template: `<updraw-editor editorId="board" (isReady)="onReady($event)"></updraw-editor>`,
  styles: [`updraw-editor { display: block; width: 100%; height: 100vh; }`],
})
export class BoardComponent {
  @ViewChild(UpdrawEditor) editor!: UpdrawEditor;
  readonly ready = signal(false);

  async onReady(_e: CustomEvent<EditorIsReadyEvent>) {
    this.ready.set(true);
    // all programmatic API usage starts here
  }
}
```

`EditorIsReadyEvent.detail` contains `host`, `activeWorkspace` (`id`, `name`, `isPublic`, `createdAt`, `updatedAt`), `syncConfig`, `assetStorageConfig`, `loginConfig`, and `theme`.

## Headless engine skeleton

The engine registers **no tools** â€” without registration the canvas accepts no input. Register at least a selection or brush tool in `(isEngineReady)`:

```ts
import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { UpdrawEngine, UpdrawBrushTool, UpdrawSelectionTool, UpdrawEraserTool } from '@updraw/angular-editor';

@Component({
  selector: 'app-headless-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UpdrawEngine],
  template: `<updraw-engine editorId="headless" (isEngineReady)="onReady()"></updraw-engine>`,
  styles: [`updraw-engine { display: block; width: 100%; height: 100%; }`],
})
export class HeadlessCanvasComponent {
  @ViewChild(UpdrawEngine) engine!: UpdrawEngine;

  async onReady() {
    await this.engine.registerTool('selection', UpdrawSelectionTool);
    await this.engine.registerTool('brush', UpdrawBrushTool);
    await this.engine.registerTool('eraser', UpdrawEraserTool);
    await this.engine.changeActiveTool('brush');
  }
}
```

Engine-only extras: it additionally exposes `exportAsJson`, `importFromJson`, `getIsPublic`, `saveSettings`, `loadSettings`, and the `workspace` input. Editor-only extras: `toolbar`, `customSvgIcons`, `loginConfig`, UI visibility flags, `openLoginDialog`, `setLoginLoading`.

## Multiple instances

Every concurrently mounted editor/engine needs a unique `editorId` â€” it namespaces settings (localStorage) and persistence (IndexedDB) keys. Without it, instances clobber each other's stored state.

```html
<updraw-editor editorId="left-board"></updraw-editor>
<updraw-editor editorId="right-board"></updraw-editor>
```

## Common setup mistakes

- Canvas invisible â†’ host element has no size (rule: explicit `display: block` + width/height).
- "Method X failed / engineRef undefined" â†’ called before `isReady`/`isEngineReady` fired.
- Headless engine ignores all pointer input â†’ no tools registered.
- Two boards share drawings/settings â†’ missing distinct `editorId`.
- `CUSTOM_ELEMENTS_SCHEMA` added â†’ unnecessary with the proxies; only needed if you put the raw `<updraw-engine>` tag in a template *without* importing the proxy component.
