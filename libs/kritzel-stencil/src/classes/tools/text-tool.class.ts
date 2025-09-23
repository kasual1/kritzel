import { KritzelText } from '../objects/text.class';
import { KritzelBaseTool } from './base-tool.class';
import { AddObjectCommand } from '../commands/add-object.command';
import { KritzelEventHelper } from '../../helpers/event.helper';
import { KritzelToolRegistry } from '../registries/tool.registry';
import { KritzelKeyboardHelper } from '../../helpers/keyboard.helper';
import { KritzelCore } from '../core/core.class';

export class KritzelTextTool extends KritzelBaseTool {
  fontFamily: string = 'Arial';
  fontSize: number = 16;
  fontColor: string = '#000000';

  palette: string[] = [
    '#000000',
    '#FFFFFF',
    '#FF0000',
    '#00FF00',
    '#0000FF',
    '#FFFF00',
    '#FF00FF',
    '#00FFFF',
    '#808080',
    '#C0C0C0',
    '#800000',
    '#008000',
    '#000080',
    '#808000',
    '#800080',
  ];

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

      if (this._core.state.activeText === null && object && object instanceof KritzelText) {
        this._core.store.setState('activeText', object);
        object.focus();
        return;
      }

      if (this._core.state.activeText !== null && object instanceof KritzelText) {
        object.focus();
        return;
      }

      if (this._core.state.activeText !== null) {
        this._core.resetActiveText();
        this._core.store.setState('activeTool', KritzelToolRegistry.getTool('selection'));
        return;
      }

      if (KritzelEventHelper.isLeftClick(event) === false) {
        return;
      }

      const clientX = event.clientX - this._core.store.offsetX;
      const clientY = event.clientY - this._core.store.offsetY;
      const text = KritzelText.create(this._core, this.fontSize, this.fontFamily);

      text.fontColor = this.fontColor;
      text.translateX = (clientX - this._core.state.translateX) / this._core.state.scale;
      text.translateY = (clientY - this._core.state.translateY) / this._core.state.scale;
      text.zIndex = this._core.store.currentZIndex;

      this._core.store.setState('activeText', text);

      this._core.history.executeCommand(new AddObjectCommand(this._core, this, text));
    }

    if (event.pointerType === 'touch') {
      const activePointers = Array.from(this._core.state.pointers.values());

      const path = event.composedPath().slice(1) as HTMLElement[];
      const objectElement = path.find(element => element.classList && element.classList.contains('object'));
      const object = this._core.findObjectById(objectElement?.id);

      if (this._core.state.activeText === null && object && object instanceof KritzelText) {
        this._core.store.setState('activeText', object);
        object.focus();
        return;
      }

      if (this._core.state.activeText !== null && object instanceof KritzelText) {
        object.focus();
        return;
      }

      if (this._core.state.activeText !== null) {
        this._core.resetActiveText();
        this._core.store.setState('activeTool', KritzelToolRegistry.getTool('selection'));
        return;
      }

      if (activePointers.length > 1) {
        return;
      }

      KritzelKeyboardHelper.disableInteractiveWidget();

      const clientX = Math.round(activePointers[0].clientX - this._core.store.offsetX);
      const clientY = Math.round(activePointers[0].clientY - this._core.store.offsetY);
      const text = KritzelText.create(this._core, this.fontSize, this.fontFamily);

      text.fontColor = this.fontColor;
      text.translateX = (clientX - this._core.state.translateX) / this._core.state.scale;
      text.translateY = (clientY - this._core.state.translateY) / this._core.state.scale;
      text.zIndex = this._core.store.currentZIndex;

      this._core.store.setState('activeText', text);

      this._core.history.executeCommand(new AddObjectCommand(this._core, this, text));
    }
  }

  handlePointerUp(event: PointerEvent): void {
    if (event.cancelable) {
      event.preventDefault();
    }

    if (event.pointerType === 'mouse') {
      this._core.state.activeText?.updateTextareaDimensions();
      this._core.state.activeText?.focus();
    }

    if (event.pointerType === 'touch') {
      this._core.state.activeText?.updateTextareaDimensions();
      this._core.state.activeText?.focus();

      KritzelKeyboardHelper.enableInteractiveWidget();
    }
  }
}
