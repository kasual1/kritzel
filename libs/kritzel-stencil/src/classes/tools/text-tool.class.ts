import { KritzelText } from '../objects/text.class';
import { KritzelBaseTool } from './base-tool.class';
import { KritzelEventHelper } from '../../helpers/event.helper';
import { KritzelToolRegistry } from '../registries/tool.registry';
import { KritzelCore } from '../core/core.class';
import { DEFAULT_COLOR_PALETTE, ThemeAwareColor } from '../../constants/color-palette.constants';

export class KritzelTextTool extends KritzelBaseTool {
  fontFamily: string = 'Arial';
  fontSize: number = 16;
  fontColor: ThemeAwareColor = DEFAULT_COLOR_PALETTE[0];
  opacity: number = 1;

  palette: ThemeAwareColor[] = [...DEFAULT_COLOR_PALETTE];

  constructor(core: KritzelCore) {
    super(core);
  }

  handlePointerDown(event: PointerEvent): void {
    if (event.cancelable) {
      event.preventDefault();
    }

    if (event.pointerType === 'mouse') {
      const path = event.composedPath().slice(1) as HTMLElement[];
      const objectElement = path.find(element => element.classList && element.classList.contains('object'));
      const object = this._core.findObjectById(objectElement?.id);

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

      this._core.store.state.objects.insert(text);

      this._core.rerender();

      text.edit(event);
    }

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      const activePointers = Array.from(this._core.store.state.pointers.values());

      const path = event.composedPath().slice(1) as HTMLElement[];
      const objectElement = path.find(element => element.classList && element.classList.contains('object'));
      const object = this._core.findObjectById(objectElement?.id);

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

      this._core.store.state.objects.insert(text);

      this._core.rerender();

      text.edit(event);
    }
  }

  handlePointerUp(event: PointerEvent): void {
    const activeText = this._core.store.activeText;
    if (activeText && activeText.isMounted && !activeText.editor?.hasFocus()) {
      activeText.focus({ x: event.clientX, y: event.clientY });
    }
  }
}
