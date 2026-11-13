# Recipes â€” proven end-to-end patterns

Composable patterns distilled from the official Vue examples. All assume the golden rules: seeding happens in the `@isReady` handler, every call awaited, Kritzel state mirrored into `ref()`s, methods called through `editor.value` (the computed ref from `getEditorRef('editor')`, resolved at the top level of `<script setup>`).

## 1. Image annotation studio (locked image + color-locked brushes)

Hide the built-in toolbar, load a background image users can't move, register one brush per color, switch from your own buttons.

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { getEditorRef, KritzelBrushTool, KritzelEditor, KritzelImage } from '@kritzel/vue-editor';

const COLORS = [
  { name: 'red',    hex: '#ff0000', dark: '#ff6666' },
  { name: 'yellow', hex: '#ffeb3b', dark: '#fff176' },
];

const editor = getEditorRef('editor');
const activeBrush = ref('red');

async function onReady() {
  if (!editor.value) return;

  const img = await KritzelImage.fromUrl('/assets/photo.jpg', { maxWidth: 800, maxHeight: 600 });
  img.translateX = -img.width / 2;
  img.translateY = -img.height / 2;
  img.isEditable = false;                            // background stays put
  await editor.value.addObject(img);
  await editor.value.centerAllObjects(false);

  for (const c of COLORS) {
    await editor.value.registerTool(`brush-${c.name}`, KritzelBrushTool, {
      color: { light: c.hex, dark: c.dark },
      size: 16,
      palette: [],                                  // locked color, no picker
    });
  }
  await activateBrush('red');
}

async function activateBrush(name: string) {
  activeBrush.value = name;
  await editor.value?.changeActiveTool(`brush-${name}`);
}
</script>

<template>
  <div style="display: flex; flex-direction: column; height: 100%">
    <div class="palette">
      <button
        v-for="c in COLORS" :key="c.name"
        :class="{ active: activeBrush === c.name }"
        :style="{ background: c.hex }"
        @click="activateBrush(c.name)"
      ></button>
    </div>
    <KritzelEditor
      ref="editor"
      editorId="annotation"
      :isToolbarVisible="false" :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false" :isUtilityPanelVisible="false"
      :style="{ flex: 1, minHeight: 0, display: 'block' }"
      @isReady="onReady"
    />
  </div>
</template>
```

## 2. Pin map / defect mapper (click â†’ world coords â†’ marker)

```ts
async function onReady() {
  if (!editor.value) return;
  const plan = await KritzelImage.fromUrl('/assets/floorplan.png', { maxWidth: 2000, maxHeight: 2000 });
  plan.isEditable = false;
  await editor.value.addObject(plan);
  await editor.value.centerAllObjects(false);
}

// template: <div @click="onCanvasClick"><KritzelEditor ref="editor" ... /></div>
async function onCanvasClick(ev: MouseEvent) {
  if (!editor.value) return;
  // subtract the element offset when the editor doesn't fill the page
  const rect = editor.value.getBoundingClientRect();
  const { x, y } = await editor.value.screenToWorld(ev.clientX - rect.left, ev.clientY - rect.top);
  const pin = new KritzelShape({
    shapeType: ShapeType.Ellipse,
    translateX: x - 25, translateY: y - 25,        // center 50Ã—50 pin on click
    width: 50, height: 50,
    rotation: -15,
    fillColor: { light: '#e53935', dark: '#ef5350' },
    strokeColor: { light: '#000000', dark: '#ffffff' },
    strokeWidth: 2,
  });
  pin.isEditable = false;                          // pins can't be dragged around
  await editor.value.addObject(pin);
}

async function focusPin(id: string) {
  if (!editor.value) return;
  const pin = await editor.value.getObjectById(id);
  if (!pin) return;
  await editor.value.setViewport(pin.centerX, pin.centerY, 1.0);  // camera only â€” pin stays put
  await editor.value.selectObjects([pin]);
}

// recolor a pin when its status changes:
await editor.value?.updateObject(pin, { fillColor: { light: '#10b981', dark: '#10b981' } });
```

## 3. Read-only infinite gallery

```vue
<script setup lang="ts">
// Only the selection tool in the toolbar â†’ users can pan/zoom/inspect but not draw.
// Define the array as a const in <script setup> â€” never inline in the template.
const toolbarItems: KritzelToolbarItem[] = [
  { name: 'select', type: 'tool', isDefault: true, tool: KritzelSelectionTool, icon: 'cursor' },
];

async function onReady() {
  if (!editor.value) return;
  const items = await Promise.all(
    artworks.map(a => KritzelImage.fromUrl(a.url, { maxWidth: 300, maxHeight: 300 })),
  );
  items.forEach((img, i) => {
    img.translateX = artworks[i].x;
    img.translateY = artworks[i].y;
    img.isEditable = false;
  });
  await editor.value.addObjects(items);             // batch insert
  await editor.value.setViewport(2000, 1350, 0.3);  // zoomed-out overview
}
</script>

<template>
  <KritzelEditor ref="editor" :toolbarItems="toolbarItems" @isReady="onReady" />
</template>
```

For a hard read-only canvas, call `await editor.value?.disable()` (re-enable with `enable()`). For huge datasets, virtualize: keep all `KritzelImage` instances in plain Maps, listen to `@viewportChange`, compute the visible world rect via `screenToWorld(0, 0)` / `screenToWorld(viewport.width, viewport.height)`, then `addObjects`/`removeObjects` the diff.

## 4. Slide deck with clamped camera

Slides are shapes at fixed world positions; navigation moves the camera and re-clamps the pan boundaries per slide. Boundaries are plain props, so back them with a `ref`:

```vue
<script setup lang="ts">
const SLIDE_W = 1920, SLIDE_H = 1080;

const slideIndex = ref(0);
const bounds = ref({ left: 0, right: SLIDE_W, top: -500, bottom: SLIDE_H + 500 });

async function onReady() {
  if (!editor.value) return;
  const slides = Array.from({ length: 5 }, (_, i) => new KritzelShape({
    shapeType: ShapeType.Rectangle,
    translateX: i * SLIDE_W, translateY: 0,
    width: SLIDE_W, height: SLIDE_H,
    fillColor: { light: '#ffffff', dark: '#1e1e1e' },
    strokeColor: { light: '#cccccc', dark: '#444444' },
    strokeWidth: 2,
  }));
  await editor.value.addObjects(slides);
  await goToSlide(0);
}

async function goToSlide(i: number) {
  slideIndex.value = i;
  await editor.value?.setViewport(i * SLIDE_W + SLIDE_W / 2, SLIDE_H / 2, 0.85);
  bounds.value = { left: i * SLIDE_W, right: (i + 1) * SLIDE_W, top: -500, bottom: SLIDE_H + 500 };
}
</script>

<template>
  <KritzelEditor
    ref="editor"
    :viewportBoundaryLeft="bounds.left"  :viewportBoundaryRight="bounds.right"
    :viewportBoundaryTop="bounds.top"    :viewportBoundaryBottom="bounds.bottom"
    :isToolbarVisible="false"
    @isReady="onReady"
  />
</template>
```

## 5. Object explorer / inspector panel

Mirror the canvas into your own model via the granular events; navigate and edit from the panel:

```ts
import type { ObjectsAddedEvent, ObjectsRemovedEvent, ObjectsUpdatedEvent } from '@kritzel/vue-editor';

// template: @objectsAdded / @objectsRemoved / @objectsUpdated â†’ update your tree ref
const allObjects = ref<KritzelBaseObject[]>([]);

function onObjectsAdded(event: CustomEvent<ObjectsAddedEvent>) {
  allObjects.value = [...allObjects.value, ...event.detail.objects];
}
function onObjectsRemoved(event: CustomEvent<ObjectsRemovedEvent>) {
  const removed = new Set(event.detail.objects.map(o => o.id));
  allObjects.value = allObjects.value.filter(o => !removed.has(o.id));
}

async function onNodeClick(id: string) {
  if (!editor.value) return;
  const obj = await editor.value.getObjectById(id);
  if (!obj) return;
  await editor.value.panToObject(obj);            // center on it, keep zoom
  await editor.value.selectObjects([obj]);
}

async function onPropertyEdit(id: string, prop: string, value: unknown) {
  if (!editor.value) return;
  const obj = await editor.value.getObjectById(id);
  if (obj) await editor.value.updateObject(obj, { [prop]: value } as any);
}

// filter by type:
const onlyShapes = await editor.value.findObjects(o => o.__class__ === 'KritzelShape');
```

## 6. Seed content factory

Keep demo/seed content in a pure factory and batch-insert once on ready. Guard against double-seeding when persistence is on:

```ts
export function createSeedObjects(): KritzelBaseObject[] {
  return [
    new KritzelShape({ translateX: 20, translateY: -150, width: 120, height: 120,
      shapeType: ShapeType.Rectangle,
      rotation: 10,
      fillColor: { light: '#fce4ec', dark: '#880e4f' },
      strokeColor: { light: '#c62828', dark: '#ef9a9a' }, strokeWidth: 3 }),
    new KritzelLine({ startX: -170, startY: 10, endX: 130, endY: 10,
      rotation: -5,
      stroke: { light: '#4caf50', dark: '#81c784' }, strokeWidth: 3 }),
    new KritzelText({ text: 'Welcome!', translateX: -60, translateY: -40, fontSize: 24,
      rotation: -90,
      fontColor: { light: '#1f2937', dark: '#f3f4f6' } }),
  ];
}

// in onReady():
const existing = await editor.value.getAllObjects();
if (existing.length === 0) {
  await editor.value.addObjects(createSeedObjects());
}
await editor.value.centerAllObjects(false);
```

## 7. Custom undo/redo + status bar

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { getEditorRef, KritzelEditor,
  type KritzelUndoState, type KritzelViewportState } from '@kritzel/vue-editor';

const editor = getEditorRef('editor');
const undoState = ref<KritzelUndoState | null>(null);
const viewport = ref<KritzelViewportState | null>(null);
</script>

<template>
  <button :disabled="!undoState?.canUndo" @click="editor?.undo()">Undo</button>
  <button :disabled="!undoState?.canRedo" @click="editor?.redo()">Redo</button>
  <span>Zoom: {{ Math.round((viewport?.scale ?? 1) * 100) }}%</span>
  <KritzelEditor
    ref="editor"
    :isUtilityPanelVisible="false"
    @undoStateChange="(e: CustomEvent<KritzelUndoState>) => undoState = e.detail"
    @viewportChange="(e: CustomEvent<KritzelViewportState>) => viewport = e.detail"
  />
</template>
```
