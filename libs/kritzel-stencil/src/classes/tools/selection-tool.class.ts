import { KritzelHandleType } from '../../enums/handle-type.enum';
import { KritzelEventHelper } from '../../helpers/event.helper';
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

export class KritzelSelectionTool extends KritzelBaseTool {
  selectionHandler: KritzelSelectionHandler;
  moveHandler: KritzelMoveHandler;
  hoverHandler: KritzelHoverHandler;
  resizeHandler: KritzelResizeHandler;
  rotationHandler: KritzelRotationHandler;
  lineHandleHandler: KritzelLineHandleHandler;

  palette: ThemeAwareColor[] = [...DEFAULT_COLOR_PALETTE];

  /** Returns true if there are objects in the selection group */
  hasSelection(): boolean {
    return !!this._core.store.selectionGroup && this._core.store.selectionGroup.objects.length > 0;
  }

  /** Returns the selected objects or empty array */
  getSelectedObjects(): any[] {
    return this._core.store.selectionGroup?.objects ?? [];
  }

  private flattenObjects(objects: any[]): any[] {
    let result: any[] = [];
    for (const obj of objects) {
      if (obj instanceof KritzelGroup) {
        result = result.concat(this.flattenObjects(obj.children));
      } else {
        result.push(obj);
      }
    }
    return result;
  }

  get color(): string | ThemeAwareColor {
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

  set color(value: string | ThemeAwareColor) {
    const objects = this.flattenObjects(this.getSelectedObjects());
    objects.forEach(obj => {
      if (obj instanceof KritzelPath) this._core.updateObject(obj, { fill: value });
      if (obj instanceof KritzelLine) this._core.updateObject(obj, { stroke: value });
      if (obj instanceof KritzelText) this._core.updateObject(obj, { fontColor: value });
      if (obj instanceof KritzelShape) this._core.updateObject(obj, { strokeColor: value });
    });
    this._core.rerender();
  }

  get opacity(): number {
    const objects = this.flattenObjects(this.getSelectedObjects());
    if (objects.length === 0) return 1;
    return objects[0].opacity;
  }

  set opacity(value: number) {
    const objects = this.flattenObjects(this.getSelectedObjects());
    objects.forEach(obj => this._core.updateObject(obj, { opacity: value }));
    this._core.rerender();
  }

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

  get fillColor(): string | ThemeAwareColor {
    const objects = this.flattenObjects(this.getSelectedObjects());
    for (const obj of objects) {
      if (obj instanceof KritzelShape) return obj.fillColor;
    }
    return { light: 'transparent', dark: 'transparent' };
  }

  set fillColor(value: string | ThemeAwareColor) {
    const objects = this.flattenObjects(this.getSelectedObjects());
    objects.forEach(obj => {
      if (obj instanceof KritzelShape) {
        this._core.updateObject(obj, { fillColor: value });
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

  get fontFamily(): string {
    const objects = this.flattenObjects(this.getSelectedObjects());
    for (const obj of objects) {
      if (obj instanceof KritzelText) return obj.fontFamily;
      if (obj instanceof KritzelShape) return obj.fontFamily;
    }
    return 'Arial';
  }

  set fontFamily(value: string) {
    const objects = this.flattenObjects(this.getSelectedObjects());
    objects.forEach(obj => {
      if (obj instanceof KritzelText) this._core.updateObject(obj, { fontFamily: value });
      if (obj instanceof KritzelShape) this._core.updateObject(obj, { fontFamily: value });
    });
    this._core.rerender();
    this.refreshSelectionGroupDimensions();
  }

  get arrows(): LineArrowConfig {
    const objects = this.flattenObjects(this.getSelectedObjects());
    for (const obj of objects) {
      if (obj instanceof KritzelLine) return obj.arrows;
    }
    return { start: { enabled: false }, end: { enabled: false } };
  }

  set arrows(value: LineArrowConfig) {
    const objects = this.flattenObjects(this.getSelectedObjects());
    objects.forEach(obj => {
      if (obj instanceof KritzelLine) this._core.updateObject(obj, { arrows: value });
    });
    this._core.rerender();
    this.refreshSelectionGroupDimensions();
  }

  /** Returns the tool config for selected objects, or null if no selection */
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

        if (
          (selectedObject === null || isDifferentObject) &&
          selectionGroup &&
          !this._core.store.state.isResizeHandleSelected &&
          !this._core.store.state.isRotationHandleSelected &&
          !this._core.store.state.isLineHandleSelected
        ) {
          this._core.removeSelectionGroup();
          this._core.rerender();
        }

        if (selectedObject && selectedObject.isSelected === false && selectedObject?.objects.length === 1 && selectedObject.objects[0].isInteractive) {
          return;
        }
      }

      this.lineHandleHandler.handlePointerDown(event);
      this.moveHandler.handlePointerDown(event);
      this.selectionHandler.handlePointerDown(event);
      this.resizeHandler.handlePointerDown(event);
      this.rotationHandler.handlePointerDown(event);

      this._core.rerender();
    }

    if (event.pointerType === 'touch') {
      if (this._core.store.state.isScaling === true) {
        return;
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

        if (!selectionGroup && selectedObject) {
          this._core.store.state.skipContextMenu = true;
        }

        if (
          (selectedObject === null || isDifferentObject) &&
          selectionGroup &&
          !this._core.store.state.isResizeHandleSelected &&
          !this._core.store.state.isRotationHandleSelected &&
          !this._core.store.state.isLineHandleSelected
        ) {
          this._core.removeSelectionGroup();
          this._core.rerender();
        }
      }

      this.lineHandleHandler.handlePointerDown(event);
      this.rotationHandler.handlePointerDown(event);
      this.resizeHandler.handlePointerDown(event);
      this.moveHandler.handlePointerDown(event);
      this.selectionHandler.handlePointerDown(event);

      this._core.rerender();
    }
  }

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

    if (event.pointerType === 'touch') {
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

    if (event.pointerType === 'touch') {
      if (this._core.store.state.isScaling === true) {
        return;
      }

      this.lineHandleHandler.handlePointerUp(event);
      this.rotationHandler.handlePointerUp(event);
      this.resizeHandler.handlePointerUp(event);
      this.moveHandler.handlePointerUp(event);
      this.selectionHandler.handlePointerUp(event);

      this._core.rerender();
    }
  }

  private getSelectedObject(event: PointerEvent): KritzelSelectionGroup | null {
    const path = event.composedPath().slice(1) as HTMLElement[];
    const objectElement = path.find(element => element.classList && element.classList.contains('object'));
    const object = this._core.findObjectById(objectElement?.id);

    if (!object) {
      return null;
    }

    const { x, y } = this._core.getCanvasPoint(event);
    if (!object.hitTest(x, y)) {
      return null;
    }

    if (object instanceof KritzelSelectionGroup) {
      return object;
    } else {
      const group = KritzelSelectionGroup.create(this._core);
      group.translateX = 0;
      group.translateY = 0;
      group.addOrRemove(object);
      return group;
    }
  }

  private getHandleType(event: PointerEvent): KritzelHandleType | undefined {
    const shadowRoot = this._core.store.state.host?.shadowRoot;
    if (!shadowRoot) return;

    const elementsAtPoint = shadowRoot.elementsFromPoint(event.clientX, event.clientY);

    const handle = elementsAtPoint.find(el => el.classList.contains('resize-handle-overlay'));

    return handle?.classList[1] as KritzelHandleType;
  }

  private isHandleSelected(event: PointerEvent): boolean {
    const shadowRoot = this._core.store.state.host?.shadowRoot;
    if (!shadowRoot) return false;

    const elementsAtPoint = shadowRoot.elementsFromPoint(event.clientX, event.clientY);

    return elementsAtPoint.some(el => el.classList.contains('resize-handle-overlay'));
  }

  private isRotationHandleSelected(event: PointerEvent): boolean {
    const shadowRoot = this._core.store.state.host?.shadowRoot;
    if (!shadowRoot) return false;

    const elementsAtPoint = shadowRoot.elementsFromPoint(event.clientX, event.clientY);

    return elementsAtPoint.some(el => el.classList.contains('rotation-handle-overlay'));
  }

  private isLineHandleSelected(event: PointerEvent): boolean {
    const shadowRoot = this._core.store.state.host?.shadowRoot;
    if (!shadowRoot) return false;

    const elementsAtPoint = shadowRoot.elementsFromPoint(event.clientX, event.clientY);

    return elementsAtPoint.some(el => el.classList.contains('selection-line-handle-overlay'));
  }

  private getLineHandleType(event: PointerEvent): LineHandleType | undefined {
    const shadowRoot = this._core.store.state.host?.shadowRoot;
    if (!shadowRoot) return;

    const elementsAtPoint = shadowRoot.elementsFromPoint(event.clientX, event.clientY);

    const handle = elementsAtPoint.find(el => el.classList.contains('selection-line-handle-overlay'));

    return handle?.classList[1] as LineHandleType;
  }
}
