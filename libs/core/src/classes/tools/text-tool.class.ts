import { UpdrawText } from '../objects/text.class';
import { UpdrawBaseTool } from './base-tool.class';
import { UpdrawEventHelper } from '../../helpers/event.helper';
import { UpdrawCore } from '../core/core.class';
import { DEFAULT_COLOR_PALETTE, ThemeAwareColor } from '../../constants/color-palette.constants';
import { DEFAULT_FONT_SIZES } from '../../constants/stroke-size.constants';
import { UpdrawFontRegistration } from '../../interfaces/font.interface';

/**
 * Text tool for creating and editing text objects on the canvas.
 * Clicking creates a new text object at the pointer position and enters edit mode.
 * Clicking on an existing text object enters edit mode for that object.
 * Supports configurable font family, size, color, and opacity.
 */
export class UpdrawTextTool extends UpdrawBaseTool {
  override toolType = 'text' as const;

  /** Backing field for {@link fontFamily}. */
  private _fontFamily: string = 'Arial';

  /** Backing field for {@link fontSize}. */
  private _fontSize: number = 16;

  /** Backing field for {@link fontColor}. */
  private _fontColor: ThemeAwareColor = DEFAULT_COLOR_PALETTE[0];

  /** Backing field for {@link opacity}. */
  private _opacity: number = 1;

  /** The font family for new text objects. */
  get fontFamily(): string {
    return this._core?.store?.activeText?.fontFamily ?? this._fontFamily;
  }
  set fontFamily(value: string) {
    this._fontFamily = value;
    this.applyToActiveText({ fontFamily: value });
  }

  /** The font size for new text objects in pixels. */
  get fontSize(): number {
    return this._core?.store?.activeText?.fontSize ?? this._fontSize;
  }
  set fontSize(value: number) {
    this._fontSize = value;
    this.applyToActiveText({ fontSize: value });
  }

  /** The font color for new text objects (supports theme-aware light/dark colors). */
  get fontColor(): ThemeAwareColor {
    return this._core?.store?.activeText?.fontColor ?? this._fontColor;
  }
  set fontColor(value: ThemeAwareColor) {
    this._fontColor = value;
    this.applyToActiveText({ fontColor: value });
  }

  /** The opacity of new text objects (0-1). */
  get opacity(): number {
    return this._core?.store?.activeText?.opacity ?? this._opacity;
  }
  set opacity(value: number) {
    this._opacity = value;
    this.applyToActiveText({ opacity: value });
  }

  /** Font family for new text objects, ignoring the text being edited. */
  get defaultFontFamily(): string {
    return this._fontFamily;
  }

  /** Font size for new text objects, ignoring the text being edited. */
  get defaultFontSize(): number {
    return this._fontSize;
  }

  /** Font color for new text objects, ignoring the text being edited. */
  get defaultFontColor(): ThemeAwareColor {
    return this._fontColor;
  }

  /** Opacity for new text objects, ignoring the text being edited. */
  get defaultOpacity(): number {
    return this._opacity;
  }

  /** Available color palette for the text tool */
  palette: ThemeAwareColor[] = [...DEFAULT_COLOR_PALETTE];

  /** Available font size presets for the text tool */
  sizes: number[] = [...DEFAULT_FONT_SIZES];

  /** Optional custom font options supplied through tool config. */
  availableFonts?: UpdrawFontRegistration[];

  /**
   * Creates a new instance of UpdrawTextTool.
   * @param core - The UpdrawCore instance that provides access to application state and functionality
   */
  constructor(core: UpdrawCore) {
    super(core);
  }

  /**
   * Propagates a property change to the text object that is currently being edited, if any.
   * Mirrors the selection tool pattern of pushing tool-config changes down to live objects,
   * but scoped to the single text in edit mode rather than the current selection.
   */
  private applyToActiveText(updatedProperties: Partial<UpdrawText>): void {
    const activeText = this._core?.store?.activeText;
    if (!activeText) return;

    this._core.updateObject(activeText, updatedProperties);
    this._core.rerender();
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

      if (activeText === null && object instanceof UpdrawText) {
        object.edit(event);
        return;
      }

      if (activeText !== null && object instanceof UpdrawText) {
        activeText.save();
        object.edit(event);
        return;
      }

      if (activeText !== null && object instanceof UpdrawText === false) {
        this._core.resetActiveText();
        this._core.store.setState('activeTool', this._core.toolRegistry.getTool('selection'));
        this.continueTitlebarPress(event);
        return;
      }

      if (UpdrawEventHelper.isLeftClick(event) === false) {
        return;
      }

      const clientX = event.clientX - this._core.store.offsetX;
      const clientY = event.clientY - this._core.store.offsetY;
      const viewportScale = this._core.store.state.scale;
      const lockScale = this._core.store.state.lockDrawingScale;
      const text = UpdrawText.create(this._core, this.fontSize, this.fontFamily, lockScale ? 1 : viewportScale);

      text.fontColor = this.fontColor;
      text.opacity = this.opacity;
      text.translateX = (clientX - this._core.store.state.translateX) / viewportScale;
      text.translateY = (clientY - this._core.store.state.translateY) / viewportScale;
      text.zIndex = this._core.store.currentZIndex;
      text.isNewlyCreated = true;

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

      if (activeText === null && object instanceof UpdrawText) {
        object.edit(event);
        return;
      }

      if (activeText !== null && object instanceof UpdrawText) {
        activeText.save();
        object.edit(event);
        return;
      }

      if (activeText !== null && object instanceof UpdrawText === false) {
        this._core.resetActiveText();
        this._core.store.setState('activeTool', this._core.toolRegistry.getTool('selection'));
        this.continueTitlebarPress(event);
        return;
      }

      if (activePointers.length > 1) {
        return;
      }

      const clientX = Math.round(activePointers[0].clientX - this._core.store.offsetX);
      const clientY = Math.round(activePointers[0].clientY - this._core.store.offsetY);
      const viewportScale = this._core.store.state.scale;
      const lockScale = this._core.store.state.lockDrawingScale;
      const text = UpdrawText.create(this._core, this.fontSize, this.fontFamily, lockScale ? 1 : viewportScale);

      text.fontColor = this.fontColor;
      text.opacity = this.opacity;
      text.translateX = (clientX - this._core.store.state.translateX) / viewportScale;
      text.translateY = (clientY - this._core.store.state.translateY) / viewportScale;
      text.zIndex = this._core.store.currentZIndex;
      text.isNewlyCreated = true;

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
