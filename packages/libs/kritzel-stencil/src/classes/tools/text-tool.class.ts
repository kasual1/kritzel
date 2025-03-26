import { KrtizelText } from '../objects/text.class';
import { KritzelStore } from '../../stores/store';
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
      const { clientX, clientY } = event;
      const text = new KrtizelText(this._store);
      text.translateX = (clientX - this._store.state.translateX) / this._store.state.scale;
      text.translateY = (clientY - this._store.state.translateY) / this._store.state.scale;
      text.width = text.width / this._store.state.scale;
      text.height = text.height / this._store.state.scale;
      text.fontSize = 16;
      text.zIndex = this._store.currentZIndex;

      this.isWriting = true;

      this._store.executeCommand(new AddObjectCommand(this._store, this, text));
    }
  }
}
