# Recipes â€” proven end-to-end patterns

Composable patterns distilled from the official React examples. All assume the golden rules: seeding happens in `onIsReady`, every call awaited, Kritzel state mirrored into `useState`, methods called through the ref.

## 1. Image annotation studio (locked image + color-locked brushes)

Hide the built-in toolbar, load a background image users can't move, register one brush per color, switch from your own buttons.

```tsx
const COLORS = [
  { name: 'red',    hex: '#ff0000', dark: '#ff6666' },
  { name: 'yellow', hex: '#ffeb3b', dark: '#fff176' },
];

export function AnnotationStudio() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);

  async function onReady() {
    const editor = editorRef.current;
    if (!editor) return;

    const img = await KritzelImage.fromUrl('/assets/photo.jpg', { maxWidth: 800, maxHeight: 600 });
    img.translateX = 0;
    img.translateY = 0;
    img.isEditable = false;                       // background stays put
    await editor.addObject(img);
    await editor.centerAllObjects(false);

    for (const c of COLORS) {
      await editor.registerTool(`brush-${c.name}`, KritzelBrushTool, {
        color: { light: c.hex, dark: c.dark },
        size: 16,
        palette: [],                              // locked color, no picker
      });
    }
    await editor.changeActiveTool('brush-red');
  }

  async function activateBrush(name: string) {
    await editorRef.current?.changeActiveTool(`brush-${name}`);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="palette">
        {COLORS.map(c => (
          <button key={c.name} style={{ background: c.hex }} onClick={() => void activateBrush(c.name)} />
        ))}
      </div>
      <KritzelEditor
        ref={editorRef}
        editorId="annotation"
        isToolbarVisible={false} isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false} isUtilityPanelVisible={false}
        onIsReady={() => void onReady()}
        style={{ flex: 1, minHeight: 0, display: 'block' }}
      />
    </div>
  );
}
```

## 2. Pin map / defect mapper (click â†’ world coords â†’ marker)

```tsx
async function onReady() {
  const editor = editorRef.current;
  if (!editor) return;
  const plan = await KritzelImage.fromUrl('/assets/floorplan.png', { maxWidth: 2000, maxHeight: 2000 });
  plan.isEditable = false;
  await editor.addObject(plan);
  await editor.centerAllObjects(false);
}

async function onCanvasClick(ev: React.MouseEvent) {
  const editor = editorRef.current;
  if (!editor) return;
  const { x, y } = await editor.screenToWorld(ev.clientX, ev.clientY);
  const pin = new KritzelShape({
    shapeType: ShapeType.Ellipse,
    translateX: x - 25, translateY: y - 25,        // center 50Ã—50 pin on click
    width: 50, height: 50,
    rotation: -15,
    fillColor: { light: '#e53935', dark: '#ef5350' },
    strokeColor: { light: '#000000', dark: '#ffffff' },
    strokeWidth: 2,
  });
  await editor.addObject(pin);
}

async function focusPin(id: string) {
  const editor = editorRef.current;
  if (!editor) return;
  const pin = await editor.getObjectById(id);
  if (!pin) return;
  await editor.setViewport(pin.centerX, pin.centerY, 1.0);  // camera only â€” pin stays put
  await editor.selectObjects([pin]);
}
```

## 3. Read-only infinite gallery

```tsx
// Only the selection tool in the toolbar â†’ users can pan/zoom/inspect but not draw
const toolbarItems: KritzelToolbarItem[] = [
  { name: 'select', type: 'tool', isDefault: true, tool: KritzelSelectionTool, icon: 'cursor' },
];

async function onReady() {
  const editor = editorRef.current;
  if (!editor) return;
  const items = await Promise.all(
    artworks.map(a => KritzelImage.fromUrl(a.url, { maxWidth: 300, maxHeight: 300 })),
  );
  items.forEach((img, i) => {
    img.translateX = artworks[i].x;
    img.translateY = artworks[i].y;
    img.isEditable = false;
  });
  await editor.addObjects(items);             // batch insert
  await editor.setViewport(2000, 1350, 0.3);  // zoomed-out overview
}
```

For a hard read-only canvas, call `await editor.disable()` (re-enable with `enable()`).

## 4. Slide deck with clamped camera

Slides are shapes at fixed world positions; navigation moves the camera and re-clamps the pan boundaries per slide. Boundaries are plain props, so back them with state:

```tsx
const SLIDE_W = 1920, SLIDE_H = 1080;

const [slideIndex, setSlideIndex] = useState(0);
const [bounds, setBounds] = useState({ left: 0, right: SLIDE_W, top: -500, bottom: SLIDE_H + 500 });

async function onReady() {
  const editor = editorRef.current;
  if (!editor) return;
  const slides = Array.from({ length: 5 }, (_, i) => new KritzelShape({
    shapeType: ShapeType.Rectangle,
    translateX: i * SLIDE_W, translateY: 0,
    width: SLIDE_W, height: SLIDE_H,
    fillColor: { light: '#ffffff', dark: '#1e1e1e' },
    strokeColor: { light: '#cccccc', dark: '#444444' },
    strokeWidth: 2,
  }));
  await editor.addObjects(slides);
  await goToSlide(0);
}

async function goToSlide(i: number) {
  setSlideIndex(i);
  await editorRef.current?.setViewport(i * SLIDE_W + SLIDE_W / 2, SLIDE_H / 2, 0.85);
  setBounds({ left: i * SLIDE_W, right: (i + 1) * SLIDE_W, top: -500, bottom: SLIDE_H + 500 });
}

<KritzelEditor
  ref={editorRef}
  viewportBoundaryLeft={bounds.left}  viewportBoundaryRight={bounds.right}
  viewportBoundaryTop={bounds.top}    viewportBoundaryBottom={bounds.bottom}
  isToolbarVisible={false}
  onIsReady={() => void onReady()}
/>
```

## 5. Object explorer / inspector panel

Mirror the canvas into your own model via the granular events; navigate and edit from the panel:

```tsx
// JSX: onObjectsAdded / onObjectsRemoved / onObjectsUpdated â†’ update your tree state

async function onNodeClick(id: string) {
  const editor = editorRef.current;
  if (!editor) return;
  const obj = await editor.getObjectById(id);
  if (!obj) return;
  await editor.setViewport(obj.centerX, obj.centerY, 1.0);
  await editor.selectObjects([obj]);
}

async function onPropertyEdit(id: string, prop: string, value: unknown) {
  const editor = editorRef.current;
  if (!editor) return;
  const obj = await editor.getObjectById(id);
  if (obj) await editor.updateObject(obj, { [prop]: value } as any);
}

// filter by type:
const onlyShapes = await editor.findObjects(o => o.__class__ === 'KritzelShape');
```

## 6. Seed content factory

Keep demo/seed content in a pure factory and batch-insert once on ready. Guard against double-seeding when persistence is on:

```tsx
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
const existing = await editor.getAllObjects();
if (existing.length === 0) {
  await editor.addObjects(createSeedObjects());
}
await editor.centerAllObjects(false);
```

## 7. Custom undo/redo + status bar

```tsx
const [undoState, setUndoState] = useState<KritzelUndoState | null>(null);
const [viewport, setViewport] = useState<KritzelViewportState | null>(null);

<button disabled={!undoState?.canUndo} onClick={() => void editorRef.current?.undo()}>Undo</button>
<button disabled={!undoState?.canRedo} onClick={() => void editorRef.current?.redo()}>Redo</button>
<KritzelEditor
  ref={editorRef}
  isUtilityPanelVisible={false}
  onUndoStateChange={event => setUndoState(event.detail)}
  onViewportChange={event => setViewport(event.detail)}
/>
```
