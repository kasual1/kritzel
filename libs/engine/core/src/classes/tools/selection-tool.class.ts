import { KritzelHandleType } from '../../enums/handle-type.enum';
import { KritzelEventHelper } from '../../helpers/event.helper';
import { ObjectHelper } from '../../helpers/object.helper';
import { KritzelClassHelper } from '../../helpers/class.helper';
import { KritzelColorHelper } from '../../helpers/color.helper';
import { KritzelMoveHandler } from '../handlers/move.handler';
import { KritzelResizeHandler } from '../handlers/resize.handler';
import { KritzelRotationHandler } from '../handlers/rotation.handler';
import { KritzelSelectionHandler } from '../handlers/selection.handler';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelGroup } from '../objects/group.class';
import { KritzelBaseTool } from './base-tool.class';
import { KritzelHoverHandler } from '../handlers/hover.handler';
import { KritzelCore } from '../core/core.class';
import { KritzelLineHandleHandler, LineHandleType } from '../handlers/line-handle.handler';
import { KritzelPath } from '../objects/path.class';
import { KritzelLine } from '../objects/line.class';
import { KritzelShape } from '../objects/shape.class';
import { KritzelText } from '../objects/text.class';
import { KritzelImage } from '../objects/image.class';
import { ToolConfigControl, ToolConfigDefinition } from '../../interfaces/tool-config.interface';
import { DEFAULT_COLOR_PALETTE, ThemeAwareColor } from '../../constants/color-palette.constants';
import { LineArrowConfig } from '../../interfaces/arrow-head.interface';

/**
 * Selection tool for selecting, moving, resizing, and rotating objects on the canvas.
 * Provides comprehensive object manipulation capabilities including multi-select,
 * property editing, and various transformation handles. Delegates specific interactions
 * to specialized handlers (selection, move, resize, rotation, hover, line handle).
 */
export class KritzelSelectionTool extends KritzelBaseTool {
  override toolType = 'selection' as const;

  /** Handler for selection box and object selection logic */
  selectionHandler: KritzelSelectionHandler;

  /** Handler for moving selected objects */
  moveHandler: KritzelMoveHandler;

  /** Handler for hover effects on objects */
  hoverHandler: KritzelHoverHandler;

  /** Handler for resizing selected objects */
  resizeHandler: KritzelResizeHandler;

  /** Handler for rotating selected objects */
  rotationHandler: KritzelRotationHandler;

  /** Handler for manipulating line start/end handles */
  lineHandleHandler: KritzelLineHandleHandler;

  /** Available color palette for selected objects */
  palette: ThemeAwareColor[] = [...DEFAULT_COLOR_PALETTE];

  /**
   * Stores a selection group that was cleared on the first finger-down of a
   * potential pinch-zoom gesture, so it can be restored when the second finger
   * arrives. Cleared when the touch interaction ends.
   */
  private _savedSelectionGroupForPinch: KritzelSelectionGroup | null = null;

  /**
   * Checks if there are any objects currently selected.
   * @returns True if there are objects in the selection group, false otherwise
   */
  hasSelection(): boolean {
    return !!this._core.store.selectionGroup && this._core.store.selectionGroup.objects.length > 0;
  }

  /**
   * Gets the currently selected objects.
   * @returns Array of selected objects, or empty array if no selection
   */
  getSelectedObjects(): any[] {
    return this._core.store.selectionGroup?.objects ?? [];
  }

  /**
   * Recursively flattens a collection of objects, expanding any groups into their children.
   * @param objects - Array of objects that may include groups
   * @returns Flattened array with all nested group children expanded
   */
  private flattenObjects(objects: any[]): any[] {
    let result: any[] = [];
    for (const obj of objects) {
      if (KritzelClassHelper.isInstanceOf<KritzelGroup>(obj, 'KritzelGroup')) {
        result = result.concat(this.flattenObjects(obj.children));
      } else {
        result.push(obj);
      }
    }
    return result;
  }

  /**
   * Gets the primary color of the selected objects.
   * Returns the fill color for paths, stroke for lines, font color for text, or stroke color for shapes.
   */
  get color(): ThemeAwareColor {
    const objects = this.flattenObjects(this.getSelectedObjects());
    if (objects.length === 0) return DEFAULT_COLOR_PALETTE[0];
    for (const obj of objects) {
      if (obj instanceof KritzelPath) return obj.fill;
      if (obj instanceof KritzelLine) return obj.stroke;
      if (obj instanceof KritzelText) return obj.fontColor;
      if (obj instanceof KritzelShape) return obj.strokeColor;
    }
    return DEFAULT_COLOR_PALETTE[0];
  }

  /**
   * Sets the primary color of all selected objects.
   * Updates the appropriate color property based on object type (fill, stroke, fontColor, strokeColor).
   */
  set color(value: ThemeAwareColor) {
    const objects = this.flattenObjects(this.getSelectedObjects());
    objects.forEach(obj => {
      if (obj instanceof KritzelPath) this._core.updateObject(obj, { fill: value });
      if (obj instanceof KritzelLine) this._core.updateObject(obj, { stroke: value });
      if (obj instanceof KritzelText) this._core.updateObject(obj, { fontColor: value });
      if (obj instanceof KritzelShape) this._core.updateObject(obj, { strokeColor: value });
    });
    this._core.rerender();
  }

  /**
   * Gets the opacity of the first selected object.
   * @returns The opacity value (0-1) or 1 if no selection
   */
  get opacity(): number {
    const objects = this.flattenObjects(this.getSelectedObjects());
    if (objects.length === 0) return 1;
    return objects[0].opacity;
  }

  /**
   * Sets the opacity of all selected objects.
   * @param value - The opacity value (0-1)
   */
  set opacity(value: number) {
    const objects = this.flattenObjects(this.getSelectedObjects());
    objects.forEach(obj => this._core.updateObject(obj, { opacity: value }));
    this._core.rerender();
  }

  /**
   * Gets the size (stroke width or font size) of the selected objects.
   * Returns strokeWidth for paths/lines/shapes, fontSize for text objects.
   */
  get size(): number {
    const objects = this.flattenObjects(this.getSelectedObjects());
    if (objects.length === 0) return 1;
    for (const obj of objects) {
      if (obj instanceof KritzelPath) return obj.strokeWidth;
      if (obj instanceof KritzelLine) return obj.strokeWidth;
      if (obj instanceof KritzelText) return obj.fontSize;
      if (obj instanceof KritzelShape) return obj.strokeWidth;
    }
    return 1;
  }

  /**
   * Sets the size (stroke width or font size) of all selected objects.
   * Updates strokeWidth for paths/lines/shapes and fontSize for text objects.
   * Refreshes selection group dimensions after updating.
   */
  set size(value: number) {
    const objects = this.flattenObjects(this.getSelectedObjects());
    objects.forEach(obj => {
      if (obj instanceof KritzelPath) this._core.updateObject(obj, { strokeWidth: value });
      if (obj instanceof KritzelLine) this._core.updateObject(obj, { strokeWidth: value });
      if (obj instanceof KritzelText) this._core.updateObject(obj, { fontSize: value });
      if (obj instanceof KritzelShape) this._core.updateObject(obj, { strokeWidth: value });
    });
    this._core.rerender();
    this.refreshSelectionGroupDimensions();
  }

  /**
   * Gets the fill color of the first selected shape.
   * @returns The fill color or transparent if no shapes are selected
   */
  get fillColor(): ThemeAwareColor {
    const objects = this.flattenObjects(this.getSelectedObjects());
    for (const obj of objects) {
      if (obj instanceof KritzelShape) return obj.fillColor;
    }
    return { light: 'transparent', dark: 'transparent' };
  }

  /**
   * Sets the fill color of all selected shapes.
   * Also updates the font color based on fill color contrast and syncs stroke color when fill is not transparent.
   */
  set fillColor(value: ThemeAwareColor) {
    const objects = this.flattenObjects(this.getSelectedObjects());
    objects.forEach(obj => {
      if (obj instanceof KritzelShape) {
        // Calculate new font color based on fill color
        const newFontColor = KritzelColorHelper.determineTextColor(value);
        this._core.updateObject(obj, { fillColor: value, fontColor: newFontColor });
        // When switching to fill mode, also update stroke color to match
        const isTransparent = typeof value === 'string' ? value === 'transparent' :
          (value.light === 'transparent' && value.dark === 'transparent');
        if (!isTransparent) {
          this._core.updateObject(obj, { strokeColor: value });
        }
      }
    });
    this._core.rerender();
  }

  /**
   * Gets the font family of the first selected text or shape object.
   * @returns The font family name or 'Arial' as default
   */
  get fontFamily(): string {
    const objects = this.flattenObjects(this.getSelectedObjects());
    for (const obj of objects) {
      if (obj instanceof KritzelText) return obj.fontFamily;
      if (obj instanceof KritzelShape) return obj.fontFamily;
    }
    return 'Arial';
  }

  /**
   * Sets the font family of all selected text and shape objects.
   * Refreshes selection group dimensions after updating.
   */
  set fontFamily(value: string) {
    const objects = this.flattenObjects(this.getSelectedObjects());
    objects.forEach(obj => {
      if (obj instanceof KritzelText) this._core.updateObject(obj, { fontFamily: value });
      if (obj instanceof KritzelShape) this._core.updateObject(obj, { fontFamily: value });
    });
    this._core.rerender();
    this.refreshSelectionGroupDimensions();
  }

  /**
   * Gets the arrow configuration of the first selected line.
   * @returns The arrow config or default disabled arrows if no lines are selected
   */
  get arrows(): LineArrowConfig {
    const objects = this.flattenObjects(this.getSelectedObjects());
    for (const obj of objects) {
      if (obj instanceof KritzelLine) return obj.arrows ?? { start: { enabled: false }, end: { enabled: false } };
    }
    return { start: { enabled: false }, end: { enabled: false } };
  }

  /**
   * Sets the arrow configuration of all selected lines.
   * Refreshes selection group dimensions after updating.
   */
  set arrows(value: LineArrowConfig) {
    const objects = this.flattenObjects(this.getSelectedObjects());
    objects.forEach(obj => {
      if (obj instanceof KritzelLine) this._core.updateObject(obj, { arrows: value });
    });
    this._core.rerender();
    this.refreshSelectionGroupDimensions();
  }

  /**
   * Generates a tool configuration definition based on the types of selected objects.
   * Determines which controls should be shown in the UI based on whether the selection
   * contains shapes, text, lines, images, or stroke-based objects.
   * @returns Tool configuration for the UI, or null if nothing is selected
   */
  getToolConfig(): ToolConfigDefinition | null {
    if (!this.hasSelection()) return null;

    const objects = this.flattenObjects(this.getSelectedObjects());
    const controls: ToolConfigControl[] = [];

    const hasShape = objects.some(o => o instanceof KritzelShape);
    const hasText = objects.some(o => o instanceof KritzelText);
    const hasLine = objects.some(o => o instanceof KritzelLine);
    const hasImage = objects.some(o => o instanceof KritzelImage);
    const hasStroke = objects.some(
      o => o instanceof KritzelPath || o instanceof KritzelLine || o instanceof KritzelShape
    );

    // If only images are selected, return config with opacity only (no palette, no controls)
    if (hasImage && !hasShape && !hasText && !hasLine && !hasStroke) {
      return {
        type: 'selection',
        colorProperty: 'color',
        sizeProperty: 'size',
        opacityProperty: 'opacity',
        paletteSource: 'none',
        sizesSource: 'none',
        controls: [],
      };
    }

    if (hasText && !hasStroke) {
      controls.push({ type: 'font-size', propertyName: 'size' });
      controls.push({ type: 'font-family', propertyName: 'fontFamily' });
    } else if (hasStroke && !hasText) {
      controls.push({ type: 'stroke-size', propertyName: 'size' });
    } else {
      if (hasStroke) controls.push({ type: 'stroke-size', propertyName: 'size' });
      if (hasText) controls.push({ type: 'font-family', propertyName: 'fontFamily' });
    }

    if (hasLine) {
      controls.push({ type: 'line-endings', propertyName: 'arrows' });
    }

    if (hasShape) {
      controls.push({ type: 'shape-fill', propertyName: 'fillColor' });
    }

    return {
      type: 'selection',
      colorProperty: 'color',
      sizeProperty: 'size',
      opacityProperty: 'opacity',
      paletteSource: 'palette',
      sizesSource: 'none',
      controls,
    };
  }

  /**
   * Refreshes the selection group's dimensions after object properties that affect size have changed.
   * Uses requestAnimationFrame to ensure the DOM has been updated before measuring.
   */
  private refreshSelectionGroupDimensions(): void {
    const selectionGroup = this._core.store.selectionGroup;
    if (selectionGroup) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          selectionGroup.refreshObjectDimensions();
          this._core.rerender();
        });
      });
    }
  }

  constructor(core: KritzelCore) {
    super(core);
    this.selectionHandler = new KritzelSelectionHandler(this._core);
    this.moveHandler = new KritzelMoveHandler(this._core);
    this.hoverHandler = new KritzelHoverHandler(this._core);
    this.resizeHandler = new KritzelResizeHandler(this._core);
    this.rotationHandler = new KritzelRotationHandler(this._core);
    this.lineHandleHandler = new KritzelLineHandleHandler(this._core);
  }

  /**
   * Handles pointer down events for selection and manipulation.
   * Determines the type of interaction (resize handle, rotation handle, line handle, or object)
   * and delegates to the appropriate handler. Manages selection state and supports
   * additive selection with Shift/Ctrl modifiers.
   * @param event - The PointerEvent containing pointer position and input type information
   */
  handlePointerDown(event: PointerEvent): void {
    if (event.cancelable) {
      event.preventDefault();
    }

    if (event.pointerType === 'mouse') {
      if (KritzelEventHelper.isLeftClick(event)) {
        this._core.store.state.isResizeHandleSelected = this.isHandleSelected(event);
        this._core.store.state.isRotationHandleSelected = this.isRotationHandleSelected(event);
        this._core.store.state.isLineHandleSelected = this.isLineHandleSelected(event);
        this._core.store.state.resizeHandleType = this.getHandleType(event);
        this._core.store.state.lineHandleType = this.getLineHandleType(event);

        const selectedObject = this.getSelectedObject(event);
        const selectionGroup = this._core.store.selectionGroup;
        const isDifferentObject = selectedObject && selectionGroup && selectedObject.id !== selectionGroup.id;
        const isAdditive = event.shiftKey || event.ctrlKey;

        if (
          (selectedObject === null || isDifferentObject) &&
          selectionGroup &&
          !this._core.store.state.isResizeHandleSelected &&
          !this._core.store.state.isRotationHandleSelected &&
          !this._core.store.state.isLineHandleSelected &&
          !isAdditive
        ) {
          this._core.removeSelectionGroup();
          this._core.rerender();
        }

        if (selectedObject && selectedObject.isSelected === false && selectedObject?.objects.length === 1) {
          const firstObj = selectedObject.objects[0];
          if (ObjectHelper.isKritzelEmbeddedObject(firstObj)) {
            // Selected embedded objects hand pointer interaction to their content.
            if (firstObj.isSelected && this._core.store.selectionGroup?.objects.length === 1) return;
          } else if (firstObj.isInteractive) {
            // Preserve existing behavior for text/shape edit mode
            return;
          }
        }
      }

      this.lineHandleHandler.handlePointerDown(event);
      this.moveHandler.handlePointerDown(event);
      this.selectionHandler.handlePointerDown(event);
      this.resizeHandler.handlePointerDown(event);
      this.rotationHandler.handlePointerDown(event);

      this._core.rerender();
    }

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      if (this._core.store.state.isScaling === true) {
        const activePointerCount = this._core.store.state.pointers.size;

        // During a real pinch (two active pointers), keep touch handling suspended.
        // If only one pointer is active, scaling is stale (debounce window after pinch),
        // so resume normal touch selection behavior immediately.
        if (activePointerCount === 1) {
          this._core.store.state.isScaling = false;
          this._savedSelectionGroupForPinch = null;
        }

        // A second finger has arrived to start a pinch-zoom gesture. If we
        // cleared a selection group on the first finger-down, restore it now
        // so the user's selection is preserved while zooming.
        if (this._savedSelectionGroupForPinch && !this._core.store.selectionGroup) {
          this._core.addSelectionGroup(this._savedSelectionGroupForPinch);
          this._savedSelectionGroupForPinch = null;
          this._core.rerender();
        }

        if (this._core.store.state.isScaling === true) {
          return;
        }

        // Continue with normal touch handling when scaling was stale.
      }

      if (this._core.store.state.pointers.size === 1) {
        this._core.store.state.isResizeHandleSelected = this.isHandleSelected(event);
        this._core.store.state.isRotationHandleSelected = this.isRotationHandleSelected(event);
        this._core.store.state.isLineHandleSelected = this.isLineHandleSelected(event);
        this._core.store.state.resizeHandleType = this.getHandleType(event);
        this._core.store.state.lineHandleType = this.getLineHandleType(event);

        const selectedObject = this.getSelectedObject(event);
        const selectionGroup = this._core.store.selectionGroup;
        const isDifferentObject = selectedObject && selectionGroup && selectedObject.id !== selectionGroup.id;
        const isAdditive = event.shiftKey || event.ctrlKey;

        if (!selectionGroup && selectedObject) {
          this._core.store.state.skipContextMenu = true;
        }

        if (
          (selectedObject === null || isDifferentObject) &&
          selectionGroup &&
          !this._core.store.state.isResizeHandleSelected &&
          !this._core.store.state.isRotationHandleSelected &&
          !this._core.store.state.isLineHandleSelected &&
          !isAdditive
        ) {
          // Save the selection group before removing it, so we can restore it
          // if the user adds a second finger to start a pinch-zoom gesture.
          this._savedSelectionGroupForPinch = selectionGroup;
          this._core.removeSelectionGroup();
          this._core.rerender();
        }
      }

      this.lineHandleHandler.handlePointerDown(event);
      this.rotationHandler.handlePointerDown(event);
      this.resizeHandler.handlePointerDown(event);
      this.moveHandler.handlePointerDown(event);
      
      // Only process selection handler if we are not scaling (2 pointers)
      if (this._core.store.state.pointers.size === 1) {
        this.selectionHandler.handlePointerDown(event);
      }

      this._core.rerender();
    }
  }

  /**
   * Handles pointer move events during selection and manipulation.
   * Delegates movement to the appropriate handler based on the current interaction state
   * (line handle, move, hover, selection box, resize, or rotation).
   * @param event - The PointerEvent containing the current pointer position
   */
  handlePointerMove(event: PointerEvent): void {
    if (event.cancelable) {
      event.preventDefault();
    }

    if (event.pointerType === 'mouse') {
      this.lineHandleHandler.handlePointerMove(event);
      this.moveHandler.handlePointerMove(event);
      this.hoverHandler.handlePointerMove(event);
      this.selectionHandler.handlePointerMove(event);
      this.resizeHandler.handlePointerMove(event);
      this.rotationHandler.handlePointerMove(event);

      this._core.rerender();
    }

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      if (this._core.store.state.isScaling === true) {
        return;
      }

      this.lineHandleHandler.handlePointerMove(event);
      this.rotationHandler.handlePointerMove(event);
      this.resizeHandler.handlePointerMove(event);
      this.moveHandler.handlePointerMove(event);
      this.selectionHandler.handlePointerMove(event);

      this._core.rerender();
    }
  }

  /**
   * Handles pointer up events to complete selection and manipulation operations.
   * Delegates to all handlers to finalize their respective operations.
   * @param event - The PointerEvent indicating the end of the interaction
   */
  handlePointerUp(event: PointerEvent): void {
    if (event.cancelable) {
      event.preventDefault();
    }

    if (event.pointerType === 'mouse') {
      this.lineHandleHandler.handlePointerUp(event);
      this.moveHandler.handlePointerUp(event);
      this.resizeHandler.handlePointerUp(event);
      this.rotationHandler.handlePointerUp(event);
      this.selectionHandler.handlePointerUp(event);

      this._core.rerender();
    }

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      if (this._core.store.state.isScaling === true) {
        return;
      }

      // The single-finger gesture has ended without becoming a pinch-zoom,
      // so discard any selection group we had saved for potential restoration.
      this._savedSelectionGroupForPinch = null;

      this.lineHandleHandler.handlePointerUp(event);
      this.rotationHandler.handlePointerUp(event);
      this.resizeHandler.handlePointerUp(event);
      this.moveHandler.handlePointerUp(event);
      this.selectionHandler.handlePointerUp(event);

      this._core.rerender();
    }
  }

  /**
   * Gets the object at the pointer event location and wraps it in a selection group.
   * Performs hit testing to ensure the pointer is actually over the object.
   * @param event - The PointerEvent to get the object from
   * @returns A KritzelSelectionGroup containing the object, or null if no object at that location
   */
  private getSelectedObject(event: PointerEvent): KritzelSelectionGroup | null {
    const path = event.composedPath() as HTMLElement[];
    const objectElement = path.find(element => element.classList && element.classList.contains('object'));
    const object = objectElement?.id ? this._core.findObjectById(objectElement.id) : null;

    if (!object) {
      return null;
    }

    const { x, y } = this._core.getCanvasPoint(event);
    if (!object.hitTest(x, y)) {
      return null;
    }

    const currentSelectionGroup = this._core.store.selectionGroup;
    if (currentSelectionGroup?.objects.some(selectedObject => selectedObject.id === object.id)) {
      return currentSelectionGroup;
    }

    if (object instanceof KritzelSelectionGroup) {
      return object;
    } else {
      const group = KritzelSelectionGroup.create(this._core);
      group.translateX = 0;
      group.translateY = 0;
      group.objectIds = [object.id];
      return group;
    }
  }

  /**
   * Determines the type of resize handle at the pointer location.
   * @param event - The PointerEvent to check for handle type
   * @returns The KritzelHandleType if a resize handle is at the location, undefined otherwise
   */
  private getHandleType(event: PointerEvent): KritzelHandleType | undefined {
    const shadowRoot = this._core.store.state.host?.shadowRoot;
    if (!shadowRoot) return;

    const elementsAtPoint = shadowRoot.elementsFromPoint(event.clientX, event.clientY);

    const handle = elementsAtPoint.find(el => el.classList.contains('resize-handle-overlay'));

    return handle?.classList[1] as KritzelHandleType;
  }

  /**
   * Checks if a resize handle is at the pointer location.
   * @param event - The PointerEvent to check
   * @returns True if a resize handle overlay element is at the pointer location
   */
  private isHandleSelected(event: PointerEvent): boolean {
    const shadowRoot = this._core.store.state.host?.shadowRoot;
    if (!shadowRoot) return false;

    const elementsAtPoint = shadowRoot.elementsFromPoint(event.clientX, event.clientY);

    return elementsAtPoint.some(el => el.classList.contains('resize-handle-overlay'));
  }

  /**
   * Checks if a rotation handle is at the pointer location.
   * @param event - The PointerEvent to check
   * @returns True if a rotation handle overlay element is at the pointer location
   */
  private isRotationHandleSelected(event: PointerEvent): boolean {
    const shadowRoot = this._core.store.state.host?.shadowRoot;
    if (!shadowRoot) return false;

    const elementsAtPoint = shadowRoot.elementsFromPoint(event.clientX, event.clientY);

    return elementsAtPoint.some(el => el.classList.contains('rotation-handle-overlay'));
  }

  /**
   * Checks if a line handle (start or end point) is at the pointer location.
   * @param event - The PointerEvent to check
   * @returns True if a line handle overlay element is at the pointer location
   */
  private isLineHandleSelected(event: PointerEvent): boolean {
    const shadowRoot = this._core.store.state.host?.shadowRoot;
    if (!shadowRoot) return false;

    const elementsAtPoint = shadowRoot.elementsFromPoint(event.clientX, event.clientY);

    return elementsAtPoint.some(el => el.classList.contains('selection-line-handle-overlay'));
  }

  /**
   * Determines the type of line handle (start or end) at the pointer location.
   * @param event - The PointerEvent to check for line handle type
   * @returns The LineHandleType if a line handle is at the location, undefined otherwise
   */
  private getLineHandleType(event: PointerEvent): LineHandleType | undefined {
    const shadowRoot = this._core.store.state.host?.shadowRoot;
    if (!shadowRoot) return;

    const elementsAtPoint = shadowRoot.elementsFromPoint(event.clientX, event.clientY);

    const handle = elementsAtPoint.find(el => el.classList.contains('selection-line-handle-overlay'));

    return handle?.classList[1] as LineHandleType;
  }
}
