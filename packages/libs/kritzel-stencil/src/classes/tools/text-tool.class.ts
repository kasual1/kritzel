import { KritzelText } from '../objects/text.class';
import { KritzelStore } from '../store.class';
import { KritzelBaseTool } from './base-tool.class';
import { AddObjectCommand } from '../commands/add-object.command';
import { KritzelClickHelper } from '../../helpers/click.helper';

export class KritzelTextTool extends KritzelBaseTool {
  name: string = 'text';

  fontFamily: string = 'Arial';
  fontSize: number = 16;

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
      return;
    }

    if (KritzelClickHelper.isLeftClick(event) === false) {
      return;
    }

    const clientX = event.clientX - this._store.offsetX;
    const clientY = event.clientY - this._store.offsetY;
    const text = new KritzelText(this._store, this.fontSize, this.fontFamily);

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

      text.translateX = (x - this._store.state.translateX) / this._store.state.scale;
      text.translateY = (y - this._store.state.translateY) / this._store.state.scale;
      text.zIndex = this._store.currentZIndex;

      text.adjustTextareaSize();

      this._store.state.isWriting = true;

      this._store.history.executeCommand(new AddObjectCommand(this._store, this, text));
    }
  }
}
