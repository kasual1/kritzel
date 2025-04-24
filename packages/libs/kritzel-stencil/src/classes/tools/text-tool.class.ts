import { KritzelText } from '../objects/text.class';
import { KritzelStore } from '../store.class';
import { KritzelBaseTool } from './base-tool.class';
import { AddObjectCommand } from '../commands/add-object.command';

export class KritzelTextTool extends KritzelBaseTool {
  name: string = 'text';
  icon: string = 'text';

  isWriting: boolean = false;

  constructor(store: KritzelStore) {
    super(store);
  }

  handleMouseUp(event: MouseEvent): void {
    if (this.isWriting === false) {
      const clientX = event.clientX - this._store.offsetX;
      const clientY = event.clientY - this._store.offsetY;
      const text = new KritzelText(this._store);

      text.translateX = (clientX - this._store.state.translateX) / this._store.state.scale;
      text.translateY = (clientY - this._store.state.translateY) / this._store.state.scale;
      text.width = text.width / this._store.state.scale;
      text.height = text.height / this._store.state.scale;
      text.fontSize = 16;
      text.zIndex = this._store.currentZIndex;

      this.isWriting = true;

      this._store.history.executeCommand(new AddObjectCommand(this._store, this, text));
    }
  }

  handleTouchStart(event: TouchEvent): void {
    if (this.isWriting === false) {
      const x = Math.round(event.touches[0].clientX - this._store.offsetX);
      const y = Math.round(event.touches[0].clientY - this._store.offsetY);
      const text = new KritzelText(this._store);

      text.translateX = (x - this._store.state.translateX) / this._store.state.scale;
      text.translateY = (y - this._store.state.translateY) / this._store.state.scale;
      text.width = text.width / this._store.state.scale;
      text.height = text.height / this._store.state.scale;
      text.fontSize = 16;
      text.zIndex = this._store.currentZIndex;

      this.isWriting = true;

      this._store.history.executeCommand(new AddObjectCommand(this._store, this, text));
    }
  }
}
