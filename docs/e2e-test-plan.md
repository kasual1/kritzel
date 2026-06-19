# E2E Playwright Test Plan for `<kritzel-editor>`

## Overview

Comprehensive Playwright e2e test suite covering all tools, all object types, object interactions (move, resize, rotate), and infinite canvas scenarios. Tests run across Angular, React, and Vue demo apps.

**Estimated total: ~25 test files, 170+ individual tests**

---

## Fixture Extensions (`e2e/fixtures/editor.fixture.ts`)

The existing `EditorPage` class needs the following new helper methods:

### Tool Activation
| Method | Description |
|--------|-------------|
| `clickToolButton(name: string)` | Click a tool button in the `kritzel-controls` shadow DOM by name |
| `clickShapeSubOption(type: ShapeType)` | Click a shape sub-option (rectangle, ellipse, triangle) |

### Mouse Interactions
| Method | Description |
|--------|-------------|
| `getEngineBoundingBox()` | Get the engine element's bounding rect for screen coordinate math |
| `worldToScreen(x, y)` | Convert world coordinates to screen coordinates via the API |
| `screenToWorld(x, y)` | Convert screen coordinates to world coordinates via the API |
| `drawStroke(worldPoints[])` | Mouse down → move through points → mouse up (for brush/eraser) |
| `clickAtWorld(x, y)` | Click at a world position on the engine |
| `dragFromTo(from, to)` | Drag from one world position to another (for drawing shapes/lines, moving, resizing) |

### Viewport
| Method | Description |
|--------|-------------|
| `getViewport()` | Get current viewport state (x, y, scale) |
| `setViewport(x, y, scale)` | Set viewport position and scale |
| `panTo(x, y)` | Pan to world coordinates |
| `zoomTo(scale, worldX?, worldY?)` | Zoom to a specific scale, optionally around a point |
| `backToContent()` | Pan/zoom to fit all content |

### Additional Queries
| Method | Description |
|--------|-------------|
| `getObjectById(id)` | Get a single object by ID |
| `getObjectsInViewport()` | Get all objects visible in the current viewport |
| `findObjects(predicate)` | Find objects matching a predicate |

### Clipboard & Editing
| Method | Description |
|--------|-------------|
| `copy()` | Copy selected objects |
| `paste(x, y)` | Paste at coordinates |
| `deleteSelected()` | Delete selected objects |
| `copyToSystemClipboard()` | Dispatch a copy event and return the serialized clipboard payload |

### Ordering
| Method | Description |
|--------|-------------|
| `bringForward()` | Move selected object forward one z-level |
| `sendBackward()` | Move selected object backward one z-level |
| `bringToFront()` | Move selected object to the very front |
| `sendToBack()` | Move selected object to the very back |

### Alignment & Grouping
| Method | Description |
|--------|-------------|
| `alignObjects(alignment)` | Align selected objects (6 alignment modes) |
| `group()` | Group selected objects |
| `ungroup()` | Ungroup selected group |

### Events
| Method | Description |
|--------|-------------|
| `prepareWaitForEvent(name)` | Set up a listener for any editor/engine event |
| `waitForEvent()` | Await the event set up by `prepareWaitForEvent` |

### Enable/Disable
| Method | Description |
|--------|-------------|
| `disable()` | Disable the editor |
| `enable()` | Re-enable the editor |

---

## Test Structure

### Phase 1 — Object Types (Programmatic API)

#### `object-creation.spec.ts` — Object CRUD (~15 tests)

```
describe('Object CRUD')

  describe('addObject')
    ✅ should add a shape and return the object with an id
    ✅ should add multiple objects and maintain correct count
    ✅ should render DOM elements for each added object

  describe('getObjectById')
    ✅ should return the object when it exists
    ✅ should return null for a nonexistent id

  describe('updateObject')
    ✅ should update an object position via updateObject
    ✅ should update an object fill color and re-render
    ✅ should update width and height of a shape

  describe('removeObject')
    ✅ should remove an object and decrement the count
    ✅ should remove the DOM element for the removed object
    ✅ should return the removed object

  describe('getAllObjects')
    ✅ should return empty array when canvas is empty
    ✅ should return all objects after adding several

  describe('findObjects')
    ✅ should find objects matching a predicate
    ✅ should return empty array when no objects match

  describe('getObjectsTotalCount')
    ✅ should return 0 on empty canvas
    ✅ should return correct count after additions and removals

  describe('getObjectsInViewport')
    ✅ should return only objects visible in the current viewport
    ✅ should exclude objects panned out of view
```

#### `object-shapes.spec.ts` — All Shape Types (~12 tests)

```
describe('Shape objects')

  describe('Rectangle')
    ✅ should add a rectangle with specified dimensions
    ✅ should render rectangle SVG with correct fill color
    ✅ should support stroke color and stroke width
    📸 visual: rectangle at various sizes

  describe('Ellipse')
    ✅ should add an ellipse with specified dimensions
    ✅ should render ellipse SVG element
    📸 visual: ellipse rendering

  describe('Triangle')
    ✅ should add a triangle with specified dimensions
    ✅ should render triangle SVG element
    📸 visual: triangle rendering

  describe('Shape with text')
    ✅ should add a shape with font properties
    ✅ should update font size on an existing shape

  📸 visual: all three shape types side by side
```

#### `object-lines.spec.ts` — Line Objects (~12 tests)

```
describe('Line objects')
  ✅ should add a straight line between two points
  ✅ should add a curved line with control point
  ✅ should add a line with start arrow
  ✅ should add a line with end arrow
  ✅ should add a line with both arrows
  ✅ should add a line with custom stroke color and width
  ✅ should add a line with start anchor to a shape
  ✅ should add a line with end anchor to a shape
  ✅ should add a line anchored between two shapes
  📸 visual: straight line
  📸 visual: curved line with arrows
  📸 visual: anchored line between shapes
```

#### `object-text.spec.ts` — Text Objects (~8 tests)

```
describe('Text objects')
  ✅ should add text with specified content
  ✅ should position text at translateX/Y
  ✅ should set font size
  ✅ should set font family
  ✅ should set font color as ThemeAwareColor
  ✅ should set explicit width and height
  ✅ should render text as HTML (not SVG) element
  📸 visual: text with default styling
  📸 visual: text with custom font and color
```

#### `object-paths.spec.ts` — Brush Path Objects (~8 tests)

```
describe('Path objects')
  ✅ should add a path with point array
  ✅ should set stroke width
  ✅ should set fill color
  ✅ should set lineSlack for smoothing
  ✅ should position path at translateX/Y
  ✅ should render path SVG element
  📸 visual: path with multiple points
  📸 visual: path with thick stroke
```

#### `object-images.spec.ts` — Image Objects (~6 tests)

```
describe('Image objects')
  ✅ should add an image from a data URL
  ✅ should position image at translateX/Y
  ✅ should set explicit width and height
  ✅ should set maxWidth/maxHeight constraints
  ✅ should render the image element in the DOM
  📸 visual: image object
```

---

### Phase 2 — API-Driven Interactions

#### `selection.spec.ts` — Selection Mechanics (~8 tests)

```
describe('Selection')

  describe('selectObjects')
    ✅ should select a single object by passing it to selectObjects
    ✅ should select multiple objects
    ✅ getSelectedObjects should return the selected objects

  describe('selectAllObjectsInViewport')
    ✅ should select all objects currently in viewport
    ✅ should not select objects outside viewport

  describe('clearSelection')
    ✅ should deselect all objects
    ✅ getSelectedObjects should return empty after clear

  describe('triggerSelectionChange')
    ✅ should emit the selection change event

  📸 visual: single object selected with handles
  📸 visual: multiple objects selected
```

#### `clipboard.spec.ts` — Copy/Paste/Delete (~9 tests)

```
describe('Clipboard')

  describe('copy and paste')
    ✅ should copy a selected object
    ✅ copy should serialize the selection to the system clipboard
    ✅ should paste copied object at specified coordinates
    ✅ pasted object should have a new id (not the same as original)
    ✅ pasted object should appear at the paste coordinates

  describe('delete')
    ✅ should delete the selected object
    ✅ should delete multiple selected objects
    ✅ object count should decrease after delete
    ✅ deleted objects should not appear in DOM

  describe('copy-paste with groups')
    ✅ should copy and paste a grouped object
```

#### `ordering.spec.ts` — Z-Ordering (~6 tests)

```
describe('Ordering')
  ✅ should bring an object forward one level
  ✅ should send an object backward one level
  ✅ should bring an object to the front
  ✅ should send an object to the back
  ✅ ordering should affect the rendering order in DOM
  📸 visual: three overlapping shapes with specific z-order
```

#### `alignment.spec.ts` — Object Alignment (~8 tests)

```
describe('Alignment')
  ✅ should align objects to StartHorizontal (left edges)
  ✅ should align objects to CenterHorizontal
  ✅ should align objects to EndHorizontal (right edges)
  ✅ should align objects to StartVertical (top edges)
  ✅ should align objects to CenterVertical
  ✅ should align objects to EndVertical (bottom edges)
  📸 visual: objects aligned horizontally center
  📸 visual: objects aligned vertically center
```

#### `undo-redo.spec.ts` — Undo/Redo Stack (~9 tests)

```
describe('Undo / Redo')
  ✅ should undo adding an object
  ✅ should redo a previously undone add
  ✅ should undo object removal
  ✅ should undo object update (position change)
  ✅ should undo multiple actions in sequence
  ✅ should redo multiple actions in sequence
  ✅ redo stack should clear after a new action following undo
  ✅ should handle undo on empty history gracefully
  ✅ should handle redo on empty redo stack gracefully
```

#### `object-groups.spec.ts` — Grouping (~10 tests)

```
describe('Group objects')

  describe('group')
    ✅ should group two selected shapes into a KritzelGroup
    ✅ should group three mixed objects (shape + text + path)
    ✅ grouped object count should reflect the group as single object
    ✅ child objects should still exist but be associated with the group

  describe('ungroup')
    ✅ should ungroup a group back into individual objects
    ✅ ungrouped objects should be independently selectable
    ✅ object count should increase after ungrouping

  describe('nested groups')
    ✅ should group a group with another object
    ✅ should ungroup only the top-level group

  📸 visual: grouped objects
  📸 visual: grouped objects selected
```

#### `viewport.spec.ts` — Viewport & Navigation (~15 tests)

```
describe('Viewport')

  describe('getViewport / setViewport')
    ✅ should return initial viewport state
    ✅ should set viewport to specific x, y, scale
    ✅ viewport state should reflect the new position after setViewport

  describe('panTo')
    ✅ should pan to specified world coordinates
    ✅ viewport x/y should update after panTo

  describe('zoomTo')
    ✅ should zoom to a specified scale
    ✅ should zoom to a specified scale at a world point
    ✅ should respect scaleMax boundary
    ✅ should respect scaleMin boundary

  describe('centerObjectInViewport')
    ✅ should center a specific object in the viewport
    📸 visual: centered object

  describe('backToContent')
    ✅ should return true and pan/zoom to fit all content
    ✅ should return false when there is no content

  describe('coordinate transforms')
    ✅ screenToWorld should convert screen coords to world coords
    ✅ worldToScreen should convert world coords to screen coords
    ✅ roundtrip: screenToWorld → worldToScreen returns original coords
    ✅ transforms should account for current viewport pan and zoom

  describe('viewport boundaries')
    ✅ should respect viewportBoundaryLeft
    ✅ should respect viewportBoundaryRight
    ✅ should respect viewportBoundaryTop
    ✅ should respect viewportBoundaryBottom
```

---

### Phase 3 — Mouse-Driven Tool Tests

#### `tools-brush.spec.ts` — Brush Tool (~6 tests)

```
describe('Brush tool')
  ✅ should draw a path by clicking and dragging on the canvas
  ✅ should create a KritzelPath object after drawing
  ✅ should draw with the configured stroke width
  ✅ should draw with the configured color
  ✅ drawn path should have SVG element in DOM
  📸 visual: single brush stroke
  📸 visual: multiple brush strokes
```

> **Mouse pattern**: Activate brush tool → `page.mouse.move(startX, startY)` → `page.mouse.down()` → series of `page.mouse.move()` with `{ steps }` → `page.mouse.up()`. Use `worldToScreen` + engine bounding box offset for coordinates.

#### `tools-line.spec.ts` — Line Tool (~4 tests)

```
describe('Line tool')
  ✅ should draw a line by clicking start and end points
  ✅ drawn line should create a KritzelLine object
  ✅ line should have correct start and end coordinates
  📸 visual: line drawn with mouse
```

#### `tools-shape.spec.ts` — Shape Tool (~6 tests)

```
describe('Shape tool')

  describe('Rectangle sub-option')
    ✅ should draw a rectangle by click-dragging on the canvas
    ✅ rectangle should have approximately the dragged dimensions
    📸 visual: mouse-drawn rectangle

  describe('Ellipse sub-option')
    ✅ should draw an ellipse by click-dragging
    📸 visual: mouse-drawn ellipse

  describe('Triangle sub-option')
    ✅ should draw a triangle by click-dragging
    📸 visual: mouse-drawn triangle
```

#### `tools-text.spec.ts` — Text Tool (~4 tests)

```
describe('Text tool')
  ✅ should create a text object by clicking on the canvas
  ✅ created text should be positioned near the click location
  ✅ text object should be editable after creation
  📸 visual: text created with text tool
```

#### `tools-eraser.spec.ts` — Eraser Tool (~4 tests)

```
describe('Eraser tool')
  ✅ should erase a path object by dragging over it
  ✅ should erase a shape object by dragging over it
  ✅ should not erase objects that are not touched by the eraser
  ✅ erasing should be undoable
```

> **Technique**: Add objects programmatically first, activate eraser, then drag mouse over object positions using `worldToScreen` for precise targeting.

#### `tools-selection.spec.ts` — Selection Tool Interactions (~10 tests)

```
describe('Selection tool')

  describe('click to select')
    ✅ should select an object by clicking on it
    ✅ should deselect when clicking empty canvas
    ✅ should select a different object when clicking it

  describe('drag to select')
    ✅ should select objects within a drag-selection rectangle
    ✅ should not select objects outside the drag rectangle

  describe('move objects')
    ✅ should move a selected object by dragging it
    ✅ moved object should have updated translateX/Y
    📸 visual: object after drag-move

  describe('resize objects')
    ✅ should resize a selected object by dragging a corner handle
    ✅ resized object should have updated width/height
    📸 visual: object after resize

  describe('rotate objects')
    ✅ should rotate a selected object by dragging the rotation handle
    ✅ rotated object should have updated rotation property
    📸 visual: object after rotation

  describe('multi-select operations')
    ✅ should move multiple selected objects together
    ✅ should resize a multi-selection group
```

> **Resize/rotate handles**: After selecting an object, locate the corner handles and rotation handle within the engine shadow DOM. The rotation handle is typically positioned above the top-center of the selection bounding box.

#### `tools-image.spec.ts` — Image Tool (~2 tests)

```
describe('Image tool')
  ✅ should add an image programmatically (file dialog not testable)
  📸 visual: programmatically added image
```

---

### Phase 4 — Configuration & Edge Cases

#### `props.spec.ts` — Editor Properties (~7 tests)

```
describe('Editor props')
  ✅ should set and get isControlsVisible
  ✅ should hide controls when isControlsVisible is false
  ✅ should set and get isUtilityPanelVisible
  ✅ should set and get scaleMax
  ✅ should set and get scaleMin
  ✅ should set and get lockDrawingScale
  ✅ should set viewport boundaries
```

#### `events.spec.ts` — Editor Events (~6 tests)

```
describe('Editor events')
  ✅ should emit objectsAdded when an object is added
  ✅ should emit objectsRemoved when an object is removed
  ✅ should emit objectsUpdated when an object is updated
  ✅ should emit objectsChange on any object mutation
  ✅ should emit viewportChange when viewport changes
  ✅ should emit undoStateChange after undo or redo
```

> **Event testing pattern**: Use `page.evaluate()` to add event listener before the action, store event detail on `window.__lastEvent__`, perform action, then read the stored value.

#### `export.spec.ts` — Export (~4 tests)

```
describe('Export')
  ✅ getScreenshot should return a PNG data URL by default
  ✅ getScreenshot with 'svg' format should return SVG string
  ✅ exported PNG should not be empty when canvas has objects
  ✅ exported SVG should contain valid SVG markup
```

#### `disable-enable.spec.ts` — Enable/Disable (~3 tests)

```
describe('Disable / Enable')
  ✅ should disable the editor and prevent interactions
  ✅ should re-enable the editor after disable
  ✅ mouse clicks should not create objects when disabled
```

#### `workspaces.spec.ts` — Workspaces (~6 tests)

```
describe('Workspaces')
  ✅ should get the active workspace
  ✅ should create a new workspace
  ✅ should list all workspaces including the new one
  ✅ should update a workspace
  ✅ should delete a workspace
  ✅ objects should be workspace-scoped
```

---

## Technical Notes

### Mouse Coordinate Mapping
All mouse interactions need world-to-screen coordinate conversion:
1. Call `worldToScreen(x, y)` via the API to get screen-space coordinates
2. Get `engine.boundingBox()` for the element offset on the page
3. Add the bounding box offset to get absolute page coordinates
4. Use `page.mouse` API with the absolute coordinates

### Visual Regression (📸)
- Use `toHaveScreenshot()` on `editorPage.engine`
- Existing 1% pixel tolerance in config handles minor rendering differences
- Text tests should use consistent fonts (Arial)
- Image tests should use small base64 data URIs to avoid network flakiness

### Event Synchronization
- Use `prepareWaitForObjectsAdded()` **before** `addObject` calls
- Await `waitForObjectsAdded()` before screenshot assertions
- For mouse-drawn objects, the tool finishes on `mouseup` and the object is added async — always wait for `objectsAdded` event

### Shadow DOM Access
- Engine: `kritzel-engine` with shadow DOM — use `>>>` piercing or `page.evaluate()` with `.shadowRoot`
- Controls: `kritzel-controls` with shadow DOM — tool buttons accessed via `>>>` locator or evaluate

---

## Implementation Order

1. **Extend `editor.fixture.ts`** with all helper methods listed above
2. **Phase 1** — Object type tests (builds on existing patterns)
3. **Phase 2** — API interaction tests (uses new helpers)
4. **Phase 3** — Mouse tool tests (most complex, depends on mouse helpers)
5. **Phase 4** — Configuration and edge case tests
