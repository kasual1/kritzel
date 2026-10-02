# Recipes â€” proven end-to-end patterns

Composable patterns distilled from the official Angular examples. All assume the golden rules: seeding happens in `(isReady)`, every call awaited, OnPush + signals.

## 1. Image annotation studio (locked image + color-locked brushes)

Hide the built-in toolbar, load a background image users can't move, register one brush per color, switch from your own buttons.

```ts
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KritzelEditor],
  template: `
    <kritzel-editor editorId="annotation"
      [isToolbarVisible]="false" [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false" [isUtilityPanelVisible]="false"
      (isReady)="onReady()">
    </kritzel-editor>
    <div class="palette">
      @for (c of colors; track c.name) {
        <button (click)="activateBrush(c.name)" [style.background]="c.hex"></button>
      }
    </div>
  `,
})
export class AnnotationStudioComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;
  readonly colors = [
    { name: 'red',    hex: '#ff0000', dark: '#ff6666' },
    { name: 'yellow', hex: '#ffeb3b', dark: '#fff176' },
  ];

  async onReady() {
    const img = await KritzelImage.fromUrl('/assets/photo.jpg', { maxWidth: 800, maxHeight: 600 });
    img.translateX = 0;
    img.translateY = 0;
    img.isEditable = false;                       // background stays put
    await this.editor.addObject(img);
    await this.editor.centerAllObjects(false);

    for (const c of this.colors) {
      await this.editor.registerTool(`brush-${c.name}`, KritzelBrushTool, {
        color: { light: c.hex, dark: c.dark },
        size: 16,
        palette: [],                              // locked color, no picker
      });
    }
    await this.editor.changeActiveTool('brush-red');
  }

  async activateBrush(name: string) {
    await this.editor.changeActiveTool(`brush-${name}`);
  }
}
```

## 2. Pin map / defect mapper (click â†’ world coords â†’ marker)

```ts
async onReady() {
  const plan = await KritzelImage.fromUrl('/assets/floorplan.png', { maxWidth: 2000, maxHeight: 2000 });
  plan.isEditable = false;
  await this.editor.addObject(plan);
  await this.editor.centerAllObjects(false);
}

async onCanvasClick(ev: MouseEvent) {
  const { x, y } = await this.editor.screenToWorld(ev.clientX, ev.clientY);
  const pin = new KritzelShape({
    shapeType: ShapeType.Ellipse,
    translateX: x - 25, translateY: y - 25,        // center 50Ã—50 pin on click
    width: 50, height: 50,
    rotation: -15,
    fillColor: { light: '#e53935', dark: '#ef5350' },
    strokeColor: { light: '#000000', dark: '#ffffff' },
    strokeWidth: 2,
  });
  await this.editor.addObject(pin);
}

async focusPin(id: string) {
  const pin = await this.editor.getObjectById(id);
  if (!pin) return;
  await this.editor.setViewport(pin.centerX, pin.centerY, 1.0);  // camera only â€” pin stays put
  await this.editor.selectObjects([pin]);
}
```

## 3. Read-only infinite gallery

```ts
// Only the selection tool in the toolbar â†’ users can pan/zoom/inspect but not draw
readonly toolbarItems: KritzelToolbarItem[] = [
  { name: 'select', type: 'tool', isDefault: true, tool: KritzelSelectionTool, icon: 'cursor' },
];

async onReady() {
  const items = await Promise.all(
    this.artworks.map(a => KritzelImage.fromUrl(a.url, { maxWidth: 300, maxHeight: 300 })),
  );
  items.forEach((img, i) => {
    img.translateX = this.artworks[i].x;
    img.translateY = this.artworks[i].y;
    img.isEditable = false;
  });
  await this.editor.addObjects(items);             // batch insert
  await this.editor.setViewport(2000, 1350, 0.3);  // zoomed-out overview
}
```

For a hard read-only canvas, call `await editor.disable()` (re-enable with `enable()`).

## 4. Slide deck with clamped camera

Slides are shapes at fixed world positions; navigation moves the camera and re-clamps the pan boundaries per slide. Boundaries are plain inputs, so bind them to signals:

```html
<kritzel-editor
  [viewportBoundaryLeft]="bounds().left"  [viewportBoundaryRight]="bounds().right"
  [viewportBoundaryTop]="bounds().top"    [viewportBoundaryBottom]="bounds().bottom"
  (isReady)="onReady()">
</kritzel-editor>
```

```ts
readonly SLIDE_W = 1920; readonly SLIDE_H = 1080;
readonly bounds = signal({ left: 0, right: 1920, top: -500, bottom: 1580 });

async onReady() {
  const slides = Array.from({ length: 5 }, (_, i) => new KritzelShape({
    shapeType: ShapeType.Rectangle,
    translateX: i * this.SLIDE_W, translateY: 0,
    width: this.SLIDE_W, height: this.SLIDE_H,
    fillColor: { light: '#ffffff', dark: '#1e1e1e' },
    strokeColor: { light: '#cccccc', dark: '#444444' },
    strokeWidth: 2,
  }));
  await this.editor.addObjects(slides);
  await this.goToSlide(0);
}

async goToSlide(i: number) {
  await this.editor.setViewport(i * this.SLIDE_W + this.SLIDE_W / 2, this.SLIDE_H / 2, 0.85);
  this.bounds.set({
    left: i * this.SLIDE_W, right: (i + 1) * this.SLIDE_W,
    top: -500, bottom: this.SLIDE_H + 500,
  });
}
```

## 5. Object explorer / inspector panel

Mirror the canvas into your own model via the granular events; navigate and edit from the panel:

```ts
// template: (objectsAdded)/(objectsRemoved)/(objectsUpdated) bindings â†’ tree signals

async onNodeClick(id: string) {
  const obj = await this.editor.getObjectById(id);
  if (!obj) return;
  await this.editor.setViewport(obj.centerX, obj.centerY, 1.0);
  await this.editor.selectObjects([obj]);
}

async onPropertyEdit(id: string, prop: string, value: unknown) {
  const obj = await this.editor.getObjectById(id);
  if (obj) await this.editor.updateObject(obj, { [prop]: value } as any);
}

// filter by type:
const onlyShapes = await this.editor.findObjects(o => o.__class__ === 'KritzelShape');
```

## 6. Seed content factory

Keep demo/seed content in a pure factory and batch-insert once on ready:

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
await this.editor.addObjects(createSeedObjects());
await this.editor.centerAllObjects(false);
```

## 7. Custom undo/redo + status bar

```html
<button [disabled]="!undoState()?.canUndo" (click)="editor.undo()">Undo</button>
<button [disabled]="!undoState()?.canRedo" (click)="editor.redo()">Redo</button>
<kritzel-editor [isUtilityPanelVisible]="false"
  (undoStateChange)="undoState.set($event.detail)"
  (viewportChange)="viewport.set($event.detail)">
</kritzel-editor>
```
