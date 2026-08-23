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
| `clickToolButton(name: string)` | Click a tool button in the `kritzel-toolbar` shadow DOM by name |
| `clickShapeSubOption(type: ShapeType)` | Click a shape sub-option (rectangle, ellipse, triangle) |

### Mouse Interactions
| Method | Description |
|--------|-------------|
| `getEngineBoundingBox()` | Get the engine element's bounding rect for screen coordinate math |
| `worldToScreen(x, y)` | Convert world coordinates to screen coordinates via the API |
| `screenToWorld(x, y)` | Convert screen coordinates to world coordinates via the API |
| `drawStroke(worldPoints[])` | Mouse down â†’ move through points â†’ mouse up (for brush/eraser) |
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

### Phase 1 â€” Object Types (Programmatic API)

#### `object-creation.spec.ts` â€” Object CRUD (~15 tests)

```
describe('Object CRUD')

  describe('addObject')
    âœ… should add a shape and return the object with an id
    âœ… should add multiple objects and maintain correct count
    âœ… should render DOM elements for each added object

  describe('getObjectById')
    âœ… should return the object when it exists
    âœ… should return null for a nonexistent id

  describe('updateObject')
    âœ… should update an object position via updateObject
    âœ… should update an object fill color and re-render
    âœ… should update width and height of a shape

  describe('removeObject')
    âœ… should remove an object and decrement the count
    âœ… should remove the DOM element for the removed object
    âœ… should return the removed object

  describe('getAllObjects')
    âœ… should return empty array when canvas is empty
    âœ… should return all objects after adding several

  describe('findObjects')
    âœ… should find objects matching a predicate
    âœ… should return empty array when no objects match

  describe('getObjectsTotalCount')
    âœ… should return 0 on empty canvas
    âœ… should return correct count after additions and removals

  describe('getObjectsInViewport')
    âœ… should return only objects visible in the current viewport
    âœ… should exclude objects panned out of view
```

#### `object-shapes.spec.ts` â€” All Shape Types (~12 tests)

```
describe('Shape objects')

  describe('Rectangle')
    âœ… should add a rectangle with specified dimensions
    âœ… should render rectangle SVG with correct fill color
    âœ… should support stroke color and stroke width
    ðŸ“¸ visual: rectangle at various sizes

  describe('Ellipse')
    âœ… should add an ellipse with specified dimensions
    âœ… should render ellipse SVG element
    ðŸ“¸ visual: ellipse rendering

  describe('Triangle')
    âœ… should add a triangle with specified dimensions
    âœ… should render triangle SVG element
    ðŸ“¸ visual: triangle rendering

  describe('Shape with text')
    âœ… should add a shape with font properties
    âœ… should update font size on an existing shape

  ðŸ“¸ visual: all three shape types side by side
```

#### `object-lines.spec.ts` â€” Line Objects (~12 tests)

```
describe('Line objects')
  âœ… should add a straight line between two points
  âœ… should add a curved line with control point
  âœ… should add a line with start arrow
  âœ… should add a line with end arrow
  âœ… should add a line with both arrows
  âœ… should add a line with custom stroke color and width
  âœ… should add a line with start anchor to a shape
  âœ… should add a line with end anchor to a shape
  âœ… should add a line anchored between two shapes
  ðŸ“¸ visual: straight line
  ðŸ“¸ visual: curved line with arrows
  ðŸ“¸ visual: anchored line between shapes
```

#### `object-text.spec.ts` â€” Text Objects (~8 tests)

```
describe('Text objects')
  âœ… should add text with specified content
  âœ… should position text at translateX/Y
  âœ… should set font size
  âœ… should set font family
  âœ… should set font color as ThemeAwareColor
  âœ… should set explicit width and height
  âœ… should render text as HTML (not SVG) element
  ðŸ“¸ visual: text with default styling
  ðŸ“¸ visual: text with custom font and color
```

#### `object-paths.spec.ts` â€” Brush Path Objects (~8 tests)

```
describe('Path objects')
  âœ… should add a path with point array
  âœ… should set stroke width
  âœ… should set fill color
  âœ… should set lineSlack for smoothing
  âœ… should position path at translateX/Y
  âœ… should render path SVG element
  ðŸ“¸ visual: path with multiple points
  ðŸ“¸ visual: path with thick stroke
```

#### `object-images.spec.ts` â€” Image Objects (~6 tests)

```
describe('Image objects')
  âœ… should add an image from a data URL
  âœ… should position image at translateX/Y
  âœ… should set explicit width and height
  âœ… should set maxWidth/maxHeight constraints
  âœ… should render the image element in the DOM
  ðŸ“¸ visual: image object
```

---

### Phase 2 â€” API-Driven Interactions

#### `selection.spec.ts` â€” Selection Mechanics (~8 tests)

```
describe('Selection')

  describe('selectObjects')
    âœ… should select a single object by passing it to selectObjects
    âœ… should select multiple objects
    âœ… getSelectedObjects should return the selected objects

  describe('selectAllObjectsInViewport')
    âœ… should select all objects currently in viewport
    âœ… should not select objects outside viewport

  describe('clearSelection')
    âœ… should deselect all objects
    âœ… getSelectedObjects should return empty after clear

  describe('triggerSelectionChange')
    âœ… should emit the selection change event

  ðŸ“¸ visual: single object selected with handles
  ðŸ“¸ visual: multiple objects selected
```

#### `clipboard.spec.ts` â€” Copy/Paste/Delete (~9 tests)

```
describe('Clipboard')

  describe('copy and paste')
    âœ… should copy a selected object
    âœ… copy should serialize the selection to the system clipboard
    âœ… should paste copied object at specified coordinates
    âœ… pasted object should have a new id (not the same as original)
    âœ… pasted object should appear at the paste coordinates

  describe('delete')
    âœ… should delete the selected object
    âœ… should delete multiple selected objects
    âœ… object count should decrease after delete
    âœ… deleted objects should not appear in DOM

  describe('copy-paste with groups')
    âœ… should copy and paste a grouped object
```

#### `ordering.spec.ts` â€” Z-Ordering (~6 tests)

```
describe('Ordering')
  âœ… should bring an object forward one level
  âœ… should send an object backward one level
  âœ… should bring an object to the front
  âœ… should send an object to the back
  âœ… ordering should affect the rendering order in DOM
  ðŸ“¸ visual: three overlapping shapes with specific z-order
```

#### `alignment.spec.ts` â€” Object Alignment (~8 tests)

```
describe('Alignment')
  âœ… should align objects to StartHorizontal (left edges)
  âœ… should align objects to CenterHorizontal
  âœ… should align objects to EndHorizontal (right edges)
  âœ… should align objects to StartVertical (top edges)
  âœ… should align objects to CenterVertical
  âœ… should align objects to EndVertical (bottom edges)
  ðŸ“¸ visual: objects aligned horizontally center
  ðŸ“¸ visual: objects aligned vertically center
```

#### `undo-redo.spec.ts` â€” Undo/Redo Stack (~9 tests)

```
describe('Undo / Redo')
  âœ… should undo adding an object
  âœ… should redo a previously undone add
  âœ… should undo object removal
  âœ… should undo object update (position change)
  âœ… should undo multiple actions in sequence
  âœ… should redo multiple actions in sequence
  âœ… redo stack should clear after a new action following undo
  âœ… should handle undo on empty history gracefully
  âœ… should handle redo on empty redo stack gracefully
```

#### `object-groups.spec.ts` â€” Grouping (~10 tests)

```
describe('Group objects')

  describe('group')
    âœ… should group two selected shapes into a KritzelGroup
    âœ… should group three mixed objects (shape + text + path)
    âœ… grouped object count should reflect the group as single object
    âœ… child objects should still exist but be associated with the group

  describe('ungroup')
    âœ… should ungroup a group back into individual objects
    âœ… ungrouped objects should be independently selectable
    âœ… object count should increase after ungrouping

  describe('nested groups')
    âœ… should group a group with another object
    âœ… should ungroup only the top-level group

  ðŸ“¸ visual: grouped objects
  ðŸ“¸ visual: grouped objects selected
```

#### `viewport.spec.ts` â€” Viewport & Navigation (~15 tests)

```
describe('Viewport')

  describe('getViewport / setViewport')
    âœ… should return initial viewport state
    âœ… should set viewport to specific x, y, scale
    âœ… viewport state should reflect the new position after setViewport

  describe('panTo')
    âœ… should pan to specified world coordinates
    âœ… viewport x/y should update after panTo

  describe('zoomTo')
    âœ… should zoom to a specified scale
    âœ… should zoom to a specified scale at a world point
    âœ… should respect scaleMax boundary
    âœ… should respect scaleMin boundary

  describe('centerObjectInViewport')
    âœ… should center a specific object in the viewport
    ðŸ“¸ visual: centered object

  describe('backToContent')
    âœ… should return true and pan/zoom to fit all content
    âœ… should return false when there is no content

  describe('coordinate transforms')
    âœ… screenToWorld should convert screen coords to world coords
    âœ… worldToScreen should convert world coords to screen coords
    âœ… roundtrip: screenToWorld â†’ worldToScreen returns original coords
    âœ… transforms should account for current viewport pan and zoom

  describe('viewport boundaries')
    âœ… should respect viewportBoundaryLeft
    âœ… should respect viewportBoundaryRight
    âœ… should respect viewportBoundaryTop
    âœ… should respect viewportBoundaryBottom
```

---

### Phase 3 â€” Mouse-Driven Tool Tests

#### `tools-brush.spec.ts` â€” Brush Tool (~6 tests)

```
describe('Brush tool')
  âœ… should draw a path by clicking and dragging on the canvas
  âœ… should create a KritzelPath object after drawing
  âœ… should draw with the configured stroke width
  âœ… should draw with the configured color
  âœ… drawn path should have SVG element in DOM
  ðŸ“¸ visual: single brush stroke
  ðŸ“¸ visual: multiple brush strokes
```

> **Mouse pattern**: Activate brush tool â†’ `page.mouse.move(startX, startY)` â†’ `page.mouse.down()` â†’ series of `page.mouse.move()` with `{ steps }` â†’ `page.mouse.up()`. Use `worldToScreen` + engine bounding box offset for coordinates.

#### `tools-line.spec.ts` â€” Line Tool (~4 tests)

```
describe('Line tool')
  âœ… should draw a line by clicking start and end points
  âœ… drawn line should create a KritzelLine object
  âœ… line should have correct start and end coordinates
  ðŸ“¸ visual: line drawn with mouse
```

#### `tools-shape.spec.ts` â€” Shape Tool (~6 tests)

```
describe('Shape tool')

  describe('Rectangle sub-option')
    âœ… should draw a rectangle by click-dragging on the canvas
    âœ… rectangle should have approximately the dragged dimensions
    ðŸ“¸ visual: mouse-drawn rectangle

  describe('Ellipse sub-option')
    âœ… should draw an ellipse by click-dragging
    ðŸ“¸ visual: mouse-drawn ellipse

  describe('Triangle sub-option')
    âœ… should draw a triangle by click-dragging
    ðŸ“¸ visual: mouse-drawn triangle
```

#### `tools-text.spec.ts` â€” Text Tool (~4 tests)

```
describe('Text tool')
  âœ… should create a text object by clicking on the canvas
  âœ… created text should be positioned near the click location
  âœ… text object should be editable after creation
  ðŸ“¸ visual: text created with text tool
```

#### `tools-eraser.spec.ts` â€” Eraser Tool (~4 tests)

```
describe('Eraser tool')
  âœ… should erase a path object by dragging over it
  âœ… should erase a shape object by dragging over it
  âœ… should not erase objects that are not touched by the eraser
  âœ… erasing should be undoable
```

> **Technique**: Add objects programmatically first, activate eraser, then drag mouse over object positions using `worldToScreen` for precise targeting.

#### `tools-selection.spec.ts` â€” Selection Tool Interactions (~10 tests)

```
describe('Selection tool')

  describe('click to select')
    âœ… should select an object by clicking on it
    âœ… should deselect when clicking empty canvas
    âœ… should select a different object when clicking it

  describe('drag to select')
    âœ… should select objects within a drag-selection rectangle
    âœ… should not select objects outside the drag rectangle

  describe('move objects')
    âœ… should move a selected object by dragging it
    âœ… moved object should have updated translateX/Y
    ðŸ“¸ visual: object after drag-move

  describe('resize objects')
    âœ… should resize a selected object by dragging a corner handle
    âœ… resized object should have updated width/height
    ðŸ“¸ visual: object after resize

  describe('rotate objects')
    âœ… should rotate a selected object by dragging the rotation handle
    âœ… rotated object should have updated rotation property
    ðŸ“¸ visual: object after rotation

  describe('multi-select operations')
    âœ… should move multiple selected objects together
    âœ… should resize a multi-selection group
```

> **Resize/rotate handles**: After selecting an object, locate the corner handles and rotation handle within the engine shadow DOM. The rotation handle is typically positioned above the top-center of the selection bounding box.

#### `tools-image.spec.ts` â€” Image Tool (~2 tests)

```
describe('Image tool')
  âœ… should add an image programmatically (file dialog not testable)
  ðŸ“¸ visual: programmatically added image
```

---

### Phase 4 â€” Configuration & Edge Cases

#### `props.spec.ts` â€” Editor Properties (~7 tests)

```
describe('Editor props')
  âœ… should set and get isToolbarVisible
  âœ… should hide toolbar when isToolbarVisible is false
  âœ… should set and get isUtilityPanelVisible
  âœ… should set and get scaleMax
  âœ… should set and get scaleMin
  âœ… should set and get lockDrawingScale
  âœ… should set viewport boundaries
```

#### `events.spec.ts` â€” Editor Events (~6 tests)

```
describe('Editor events')
  âœ… should emit objectsAdded when an object is added
  âœ… should emit objectsRemoved when an object is removed
  âœ… should emit objectsUpdated when an object is updated
  âœ… should emit objectsChange on any object mutation
  âœ… should emit viewportChange when viewport changes
  âœ… should emit undoStateChange after undo or redo
```

> **Event testing pattern**: Use `page.evaluate()` to add event listener before the action, store event detail on `window.__lastEvent__`, perform action, then read the stored value.

#### `export.spec.ts` â€” Export (~4 tests)

```
describe('Export')
  âœ… getScreenshot should return a PNG data URL by default
  âœ… getScreenshot with 'svg' format should return SVG string
  âœ… exported PNG should not be empty when canvas has objects
  âœ… exported SVG should contain valid SVG markup
```

#### `disable-enable.spec.ts` â€” Enable/Disable (~3 tests)

```
describe('Disable / Enable')
  âœ… should disable the editor and prevent interactions
  âœ… should re-enable the editor after disable
  âœ… mouse clicks should not create objects when disabled
```

#### `workspaces.spec.ts` â€” Workspaces (~6 tests)

```
describe('Workspaces')
  âœ… should get the active workspace
  âœ… should create a new workspace
  âœ… should list all workspaces including the new one
  âœ… should update a workspace
  âœ… should delete a workspace
  âœ… objects should be workspace-scoped
```

---

## Technical Notes

### Mouse Coordinate Mapping
All mouse interactions need world-to-screen coordinate conversion:
1. Call `worldToScreen(x, y)` via the API to get screen-space coordinates
2. Get `engine.boundingBox()` for the element offset on the page
3. Add the bounding box offset to get absolute page coordinates
4. Use `page.mouse` API with the absolute coordinates

### Visual Regression (ðŸ“¸)
- Use `toHaveScreenshot()` on `editorPage.engine`
- Existing 1% pixel tolerance in config handles minor rendering differences
- Text tests should use consistent fonts (Arial)
- Image tests should use small base64 data URIs to avoid network flakiness

### Event Synchronization
- Use `prepareWaitForObjectsAdded()` **before** `addObject` calls
- Await `waitForObjectsAdded()` before screenshot assertions
- For mouse-drawn objects, the tool finishes on `mouseup` and the object is added async â€” always wait for `objectsAdded` event

### Shadow DOM Access
- Engine: `kritzel-engine` with shadow DOM â€” use `>>>` piercing or `page.evaluate()` with `.shadowRoot`
- toolbar: `kritzel-toolbar` with shadow DOM â€” tool buttons accessed via `>>>` locator or evaluate

---

## Implementation Order

1. **Extend `editor.fixture.ts`** with all helper methods listed above
2. **Phase 1** â€” Object type tests (builds on existing patterns)
3. **Phase 2** â€” API interaction tests (uses new helpers)
4. **Phase 3** â€” Mouse tool tests (most complex, depends on mouse helpers)
5. **Phase 4** â€” Configuration and edge case tests
