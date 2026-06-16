# Viewport: Camera, Coordinates, Boundaries

The viewport is the camera over the infinite canvas. State (`KritzelViewportState`): `translateX`, `translateY` (pan, world coords), `scale` (zoom, default 1.0), plus viewport pixel dimensions.

## The one distinction that matters

- **Camera movers** (objects stay put): `setViewport`, `panTo`, `panToObject`, `zoomTo`, `zoomIn`, `zoomOut`, `backToContent`, `centerAllObjects`, `centerObjects`.
- **Object mover**: `centerObjectInViewport(obj)` relocates the object. Never use it to "look at" static content.

To focus an object without moving it:

```ts
const obj = await editor.getObjectById('pin-1');
const vp = await editor.getViewport();
await editor.setViewport(obj.centerX, obj.centerY, vp.scale); // keep current zoom
```

## Camera API

```ts
const vp = await editor.getViewport();              // { translateX, translateY, scale, ... }

await editor.setViewport(x, y, scale);              // center camera on world (x, y) at scale
await editor.panTo(x, y);                           // pan only, keep zoom
await editor.zoomTo(1.5);                           // zoom around viewport center
await editor.zoomTo(1.5, worldX, worldY);           // zoom around a world point
await editor.zoomIn();                              // animated step (factor 1.6, 200 ms)
await editor.zoomOut();
await editor.zoomIn(2, 300);                        // custom factor / duration
```

Bounded zoom buttons pattern:

```ts
const current = (await editor.getViewport()).scale;
await editor.zoomTo(Math.min(current * 1.5, 5));    // in
await editor.zoomTo(Math.max(current / 1.5, 0.1));  // out
```

## Fitting content

```ts
await editor.backToContent();                  // pan/zoom to nearest content; true if found
await editor.centerAllObjects();               // fit ALL objects (animated; pass false to skip)
await editor.centerObjects([a, b], false);     // fit specific objects, no animation
await editor.panToObject(obj);                 // center on object, keep zoom
```

## Coordinate conversion

Pointer/DOM events give **screen pixels**; the canvas uses **world coordinates**. Always convert:

```ts
async onCanvasClick(ev: MouseEvent) {
  const { x, y } = await this.editor.screenToWorld(ev.clientX, ev.clientY);
  const pin = new KritzelShape({
    shapeType: ShapeType.Ellipse,
    translateX: x - 25, translateY: y - 25,   // center the 50×50 pin on the click
    width: 50, height: 50,
    fillColor: { light: '#e53935', dark: '#ef9a9a' },
    strokeColor: { light: '#000000', dark: '#ffffff' },
    strokeWidth: 2,
  });
  await this.editor.addObject(pin);
}
```

Inverse: `await editor.worldToScreen(x, y)` — e.g. to position an Angular overlay above an object.

## Limits and constraints (inputs on the component)

```html
<kritzel-editor
  [scaleMin]="0.1"
  [scaleMax]="10"
  [viewportBoundaryLeft]="0"
  [viewportBoundaryRight]="1920"
  [viewportBoundaryTop]="-500"
  [viewportBoundaryBottom]="1580"
  [isPanningEnabled]="false"
  [isZoomingEnabled]="false"
  [lockDrawingScale]="true">
</kritzel-editor>
```

- `scaleMin` / `scaleMax` — zoom clamps (engine enforces absolute limits on top).
- `viewportBoundary*` — pan clamps in world coordinates; default ±Infinity. Set dynamically from TS for per-state bounds (e.g. clamp camera to the current slide).
- `isPanningEnabled: false, isZoomingEnabled: false` — wheel no longer pans/zooms (event still bubbles to the page).
- `lockDrawingScale: true` (default) — brush strokes keep a fixed visual thickness regardless of zoom.

## Reacting to viewport changes

```html
<kritzel-editor (viewportChange)="onViewportChange($event)"></kritzel-editor>
```

```ts
readonly viewport = signal<KritzelViewportState | null>(null);
onViewportChange(e: CustomEvent<KritzelViewportState>) { this.viewport.set(e.detail); }
```

`objectsInViewportChange` (engine event) fires when the set of visible objects changes — useful for virtualized side panels.

## Defaults & pitfalls

- Initial viewport is `(0, 0, scale 1)`. Content placed at distant/negative coordinates starts off-screen — call `backToContent()` or `centerAllObjects()` after seeding.
- `setViewport(x, y, scale)` centers on the point — no need to subtract half the viewport size yourself.
- Don't cache viewport state across awaits during user interaction; re-read with `getViewport()`.
