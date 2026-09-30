# Viewport: Camera, Coordinates, Boundaries

The viewport is the camera over the infinite canvas. State (`KritzelViewportState`): `translateX`, `translateY` (pan, world coords), `scale` (zoom, default 1.0), plus viewport pixel dimensions.

## The one distinction that matters

- **Camera movers** (objects stay put): `setViewport`, `panTo`, `panToObject`, `zoomTo`, `zoomIn`, `zoomOut`, `backToContent`, `centerAllObjects`, `centerObjects`.
- **Object mover**: `centerObjectInViewport(obj)` relocates the object. Never use it to "look at" static content.

To focus an object without moving it:

```ts
const obj = await editor.value?.getObjectById('pin-1');
const vp = await editor.value?.getViewport();
if (obj && vp) {
  await editor.value?.setViewport(obj.centerX, obj.centerY, vp.scale); // keep current zoom
}
```

## Camera API

`editor` is the computed ref from `getEditorRef('editor')` (template-ref name string, top level of `<script setup>`); the native element lives on `editor.value`. Every method is async — always await.

```ts
const vp = await editor.value?.getViewport();         // { translateX, translateY, scale, ... }

await editor.value?.setViewport(x, y, scale);         // center camera on world (x, y) at scale
await editor.value?.panTo(x, y);                      // pan only, keep zoom
await editor.value?.zoomTo(1.5);                      // zoom around viewport center
await editor.value?.zoomTo(1.5, worldX, worldY);      // zoom around a world point
await editor.value?.zoomIn();                         // animated step (factor 1.6, 200 ms)
await editor.value?.zoomOut();
await editor.value?.zoomIn(2, 300);                   // custom factor / duration
```

Bounded zoom buttons pattern (reading scale from the mirrored `viewport` ref, see below):

```ts
async function zoomIn() {
  const current = viewport.value?.scale ?? 1;
  await editor.value?.zoomTo(Math.min(current * 1.5, 5));
}
async function zoomOut() {
  const current = viewport.value?.scale ?? 1;
  await editor.value?.zoomTo(Math.max(current / 1.5, 0.1));
}
```

## Fitting content

```ts
await editor.value?.backToContent();              // pan/zoom to nearest content; true if found
await editor.value?.centerAllObjects();           // fit ALL objects (animated; pass false to skip)
await editor.value?.centerObjects([a, b], false); // fit specific objects, no animation
await editor.value?.panToObject(obj);             // center on object, keep zoom
```

## Coordinate conversion

Pointer/DOM events give **screen pixels**; the canvas uses **world coordinates**. Always convert. `screenToWorld` expects coordinates relative to the editor element — subtract its bounding rect from `clientX`/`clientY` (a no-op when the editor fills the page, required when it doesn't):

```vue
<script setup lang="ts">
import { KritzelEditor, KritzelShape, ShapeType, getEditorRef } from '@kritzel/vue-editor';

const editor = getEditorRef('editor');

async function onCanvasClick(ev: MouseEvent) {
  if (!editor.value) return;
  const rect = editor.value.getBoundingClientRect();
  const { x, y } = await editor.value.screenToWorld(ev.clientX - rect.left, ev.clientY - rect.top);
  const pin = new KritzelShape({
    shapeType: ShapeType.Ellipse,
    translateX: x - 25, translateY: y - 25,   // center the 50×50 pin on the click
    width: 50, height: 50,
    fillColor: { light: '#e53935', dark: '#ef9a9a' },
    strokeColor: { light: '#000000', dark: '#ffffff' },
    strokeWidth: 2,
  });
  await editor.value.addObject(pin);
}
</script>

<template>
  <div @click="onCanvasClick">
    <KritzelEditor ref="editor" />
  </div>
</template>
```

Inverse: `await editor.value?.worldToScreen(x, y)` — e.g. to position a Vue overlay (absolutely positioned div) above an object.

## Limits and constraints (props on the component)

Numbers and booleans need the `:` binding:

```vue
<KritzelEditor
  ref="editor"
  :scaleMin="0.1" :scaleMax="10"
  :viewportBoundaryLeft="0"
  :viewportBoundaryRight="1920"
  :viewportBoundaryTop="-500"
  :viewportBoundaryBottom="1580"
  :isPanningEnabled="false"
  :isZoomingEnabled="false"
  :lockDrawingScale="true"
/>
```

- `scaleMin` / `scaleMax` — zoom clamps (engine enforces absolute limits on top).
- `viewportBoundary*` — pan clamps in world coordinates; default ±Infinity. They are plain props — bind them to `ref()`s for per-state bounds (e.g. clamp camera to the current slide).
- `:isPanningEnabled="false" :isZoomingEnabled="false"` — wheel no longer pans/zooms (event still bubbles to the page).
- `:lockDrawingScale="true"` (default) — brush strokes keep a fixed visual thickness regardless of zoom.

## Reacting to viewport changes

Mirror viewport state into a Vue `ref()` from the `@viewportChange` event; the payload is `event.detail`:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { KritzelEditor, getEditorRef, type KritzelViewportState } from '@kritzel/vue-editor';

const editor = getEditorRef('editor');
const viewport = ref<KritzelViewportState | null>(null);

function onViewportChange(event: CustomEvent<KritzelViewportState>) {
  viewport.value = event.detail;
}
</script>

<template>
  <KritzelEditor ref="editor" @viewportChange="onViewportChange" />
  <span>Zoom: {{ Math.round((viewport?.scale ?? 1) * 100) }}%</span>
</template>
```

`@objectsInViewportChange` (on `<KritzelEngine>`, not the editor) fires when the set of visible objects changes — useful for virtualized side panels.

## Defaults & pitfalls

- Initial viewport is `(0, 0, scale 1)`. Content placed at distant/negative coordinates starts off-screen — call `backToContent()` or `centerAllObjects()` after seeding.
- `setViewport(x, y, scale)` centers on the point — no need to subtract half the viewport size yourself.
- Don't cache viewport state across awaits during user interaction; re-read with `getViewport()`.
- `getEditorRef('editor')` returns a computed ref that is `null` until the component mounts — guard with `editor.value?.` or wait for `@isReady` before calling API methods.
