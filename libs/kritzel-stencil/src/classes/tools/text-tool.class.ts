import { KritzelText } from '../objects/text.class';
import { KritzelBaseTool } from './base-tool.class';
import { KritzelEventHelper } from '../../helpers/event.helper';
import { KritzelToolRegistry } from '../registries/tool.registry';
import { KritzelCore } from '../core/core.class';
import { DEFAULT_COLOR_PALETTE, ThemeAwareColor } from '../../constants/color-palette.constants';

/**
 * Text tool for creating and editing text objects on the canvas.
 * Clicking creates a new text object at the pointer position and enters edit mode.
 * Clicking on an existing text object enters edit mode for that object.
 * Supports configurable font family, size, color, and opacity.
 */
export class KritzelTextTool extends KritzelBaseTool {
  /** The font family for new text objects */
  fontFamily: string = 'Arial';
  
  /** The font size for new text objects in pixels */
  fontSize: number = 16;
  
  /** The font color for new text objects (supports theme-aware light/dark colors) */
  fontColor: ThemeAwareColor = DEFAULT_COLOR_PALETTE[0];
  
  /** The opacity of new text objects (0-1) */
  opacity: number = 1;

  /** Available color palette for the text tool */
  palette: ThemeAwareColor[] = [...DEFAULT_COLOR_PALETTE];

  /**
   * Creates a new instance of KritzelTextTool.
   * @param core - The KritzelCore instance that provides access to application state and functionality
   */
  constructor(core: KritzelCore) {
    super(core);
  }

  /**
   * Handles pointer down events for text creation and editing.
   * If clicking on an existing text object, enters edit mode for that object.
   * If there's an active text being edited and clicking elsewhere, saves the active text
   * and switches to selection tool. If clicking on empty space, creates a new text object
   * at that position and enters edit mode.
   * @param event - The PointerEvent containing pointer position and input type information
   */
  handlePointerDown(event: PointerEvent): void {
    if (event.cancelable) {
      event.preventDefault();
    }

    if (event.pointerType === 'mouse') {
      const path = event.composedPath().slice(1) as HTMLElement[];
      const objectElement = path.find(element => element.classList && element.classList.contains('object'));
      const object = objectElement?.id ? this._core.findObjectById(objectElement.id) : null;

      const activeText = this._core.store.activeText;

      if (activeText === null && object instanceof KritzelText) {
        object.edit(event);
        return;
      }

      if (activeText !== null && object instanceof KritzelText) {
        activeText.save();
        object.edit(event);
        return;
      }

      if (activeText !== null && object instanceof KritzelText === false) {
        this._core.resetActiveText();
        this._core.store.setState('activeTool', KritzelToolRegistry.getTool('selection'));
        return;
      }

      if (KritzelEventHelper.isLeftClick(event) === false) {
        return;
      }

      const clientX = event.clientX - this._core.store.offsetX;
      const clientY = event.clientY - this._core.store.offsetY;
      const viewportScale = this._core.store.state.scale;
      const lockScale = this._core.store.state.lockDrawingScale;
      const text = KritzelText.create(this._core, this.fontSize, this.fontFamily, lockScale ? 1 : viewportScale);

      text.fontColor = this.fontColor;
      text.opacity = this.opacity;
      text.translateX = (clientX - this._core.store.state.translateX) / viewportScale;
      text.translateY = (clientY - this._core.store.state.translateY) / viewportScale;
      text.zIndex = this._core.store.currentZIndex;

      this._core.store.objects.insert(text);

      this._core.rerender();

      text.edit(event);
    }

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      const activePointers = Array.from(this._core.store.state.pointers.values());

      const path = event.composedPath().slice(1) as HTMLElement[];
      const objectElement = path.find(element => element.classList && element.classList.contains('object'));
      const object = objectElement?.id ? this._core.findObjectById(objectElement.id) : null;

      const activeText = this._core.store.activeText;

      if (activeText === null && object instanceof KritzelText) {
        object.edit(event);
        return;
      }

      if (activeText !== null && object instanceof KritzelText) {
        activeText.save();
        object.edit(event);
        return;
      }

      if (activeText !== null && object instanceof KritzelText === false) {
        this._core.resetActiveText();
        this._core.store.setState('activeTool', KritzelToolRegistry.getTool('selection'));
        return;
      }

      if (activePointers.length > 1) {
        return;
      }

      const clientX = Math.round(activePointers[0].clientX - this._core.store.offsetX);
      const clientY = Math.round(activePointers[0].clientY - this._core.store.offsetY);
      const viewportScale = this._core.store.state.scale;
      const lockScale = this._core.store.state.lockDrawingScale;
      const text = KritzelText.create(this._core, this.fontSize, this.fontFamily, lockScale ? 1 : viewportScale);

      text.fontColor = this.fontColor;
      text.opacity = this.opacity;
      text.translateX = (clientX - this._core.store.state.translateX) / viewportScale;
      text.translateY = (clientY - this._core.store.state.translateY) / viewportScale;
      text.zIndex = this._core.store.currentZIndex;

      this._core.store.objects.insert(text);

      this._core.rerender();

      text.edit(event);
    }
  }

  /**
   * Handles pointer up events for text editing focus management.
   * If there's an active text that is mounted but doesn't have focus,
   * focuses the text editor at the pointer position to allow typing.
   * @param event - The PointerEvent containing the pointer position for focus placement
   */
  handlePointerUp(event: PointerEvent): void {
    const activeText = this._core.store.activeText;
    if (activeText && activeText.isMounted && !activeText.editor?.hasFocus()) {
      activeText.focus({ x: event.clientX, y: event.clientY });
    }
  }
}
