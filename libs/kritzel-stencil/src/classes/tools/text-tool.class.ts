import { KritzelText } from '../objects/text.class';
import { KritzelStore } from '../store.class';
import { KritzelBaseTool } from './base-tool.class';
import { AddObjectCommand } from '../commands/add-object.command';
import { KritzelEventHelper } from '../../helpers/event.helper';
import { KritzelToolRegistry } from '../registries/tool.registry';
import { KritzelKeyboardHelper } from '../../helpers/keyboard.helper';

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

  constructor(store: KritzelStore) {
    super(store);
  }

  handlePointerDown(event: PointerEvent): void {
    if (event.cancelable) {
      event.preventDefault();
    }

    if (event.pointerType === 'mouse') {
      const path = event.composedPath().slice(1) as HTMLElement[];
      const objectElement = path.find(element => element.classList && element.classList.contains('object'));
      const object = this._store.findObjectById(objectElement?.id);

      if (this._store.state.activeText === null && object && object instanceof KritzelText) {
        this._store.state.activeText = object;
        object.focus();
        return;
      }

      if (this._store.state.activeText !== null && object instanceof KritzelText) {
        object.focus();
        return;
      }

      if (this._store.state.activeText !== null) {
        this._store.resetActiveText();
        this._store.setState('activeTool', KritzelToolRegistry.getTool('selection'));
        return;
      }

      if (KritzelEventHelper.isLeftClick(event) === false) {
        return;
      }

      const clientX = event.clientX - this._store.offsetX;
      const clientY = event.clientY - this._store.offsetY;
      const text = KritzelText.create(this._store, this.fontSize, this.fontFamily);

      text.fontColor = this.fontColor;
      text.translateX = (clientX - this._store.state.translateX) / this._store.state.scale;
      text.translateY = (clientY - this._store.state.translateY) / this._store.state.scale;
      text.zIndex = this._store.currentZIndex;

      this._store.state.activeText = text;

      this._store.history.executeCommand(new AddObjectCommand(this._store, this, text));
    }

    if (event.pointerType === 'touch') {
      const activePointers = Array.from(this._store.state.pointers.values());

      const path = event.composedPath().slice(1) as HTMLElement[];
      const objectElement = path.find(element => element.classList && element.classList.contains('object'));
      const object = this._store.findObjectById(objectElement?.id);

      if (this._store.state.activeText === null && object && object instanceof KritzelText) {
        this._store.state.activeText = object;
        object.focus();
        return;
      }

      if (this._store.state.activeText !== null && object instanceof KritzelText) {
        object.focus();
        return;
      }

      if (this._store.state.activeText !== null) {
        this._store.resetActiveText();
        this._store.setState('activeTool', KritzelToolRegistry.getTool('selection'));
        return;
      }

      if (activePointers.length > 1) {
        return;
      }

      KritzelKeyboardHelper.disableInteractiveWidget();

      const clientX = Math.round(activePointers[0].clientX - this._store.offsetX);
      const clientY = Math.round(activePointers[0].clientY - this._store.offsetY);
      const text = KritzelText.create(this._store, this.fontSize, this.fontFamily);

      text.fontColor = this.fontColor;
      text.translateX = (clientX - this._store.state.translateX) / this._store.state.scale;
      text.translateY = (clientY - this._store.state.translateY) / this._store.state.scale;
      text.zIndex = this._store.currentZIndex;

      this._store.state.activeText = text;

      this._store.history.executeCommand(new AddObjectCommand(this._store, this, text));
    }
  }

  handlePointerUp(event: PointerEvent): void {
    if (event.cancelable) {
      event.preventDefault();
    }

    if (event.pointerType === 'mouse') {
      this._store.state.activeText?.adjustTextareaSize();
      this._store.state.activeText?.focus();
    }

    if (event.pointerType === 'touch') {
      this._store.state.activeText?.adjustTextareaSize();
      this._store.state.activeText?.focus();

      KritzelKeyboardHelper.enableInteractiveWidget();
    }
  }
}
