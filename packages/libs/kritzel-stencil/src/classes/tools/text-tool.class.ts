import { KritzelText } from '../objects/text.class';
import { KritzelStore } from '../store.class';
import { KritzelBaseTool } from './base-tool.class';
import { AddObjectCommand } from '../commands/add-object.command';
import { KritzelMouseHelper } from '../../helpers/click.helper';
import { KritzelToolRegistry } from '../tool.registry';

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

  handleMouseUp(event: MouseEvent): void {
    const path = event.composedPath().slice(1) as HTMLElement[];
    const objectElement = path.find(element => element.classList && element.classList.contains('object'));
    const object = this._store.findObjectById(objectElement?.id);

    if (this._store.state.activeText === null && object && object instanceof KritzelText) {
      this._store.state.activeText = object;
      return;
    }

    if (this._store.state.activeText !== null && object instanceof KritzelText) {
      return;
    }

    if (this._store.state.activeText !== null) {
      this._store.resetActiveText();
      this._store.setState('activeTool', KritzelToolRegistry.getTool('selection'));
      return;
    }

    if (KritzelMouseHelper.isLeftClick(event) === false) {
      return;
    }

    const clientX = event.clientX - this._store.offsetX;
    const clientY = event.clientY - this._store.offsetY;
    const text = new KritzelText(this._store, this.fontSize, this.fontFamily);

    text.fontColor = this.fontColor;
    text.translateX = (clientX - this._store.state.translateX) / this._store.state.scale;
    text.translateY = (clientY - this._store.state.translateY) / this._store.state.scale;
    text.zIndex = this._store.currentZIndex;

    text.adjustTextareaSize();

    this._store.state.activeText = text;

    this._store.history.executeCommand(new AddObjectCommand(this._store, this, text));
  }

  handleTouchStart(event: TouchEvent): void {
    if (this._store.state.isWriting === false) {
      const x = Math.round(event.touches[0].clientX - this._store.offsetX);
      const y = Math.round(event.touches[0].clientY - this._store.offsetY);
      const text = new KritzelText(this._store, this.fontSize, this.fontFamily);

      text.fontColor = this.fontColor;
      text.translateX = (x - this._store.state.translateX) / this._store.state.scale;
      text.translateY = (y - this._store.state.translateY) / this._store.state.scale;
      text.zIndex = this._store.currentZIndex;

      text.adjustTextareaSize();

      this._store.state.isWriting = true;

      this._store.history.executeCommand(new AddObjectCommand(this._store, this, text));
    }
  }
}
