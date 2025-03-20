import { kritzelViewportState } from '../../stores/viewport.store';
import { KrtizelText } from '../objects/text.class';
import { KritzelStore } from '../../stores/store';
import { KritzelBaseTool } from './base-tool.class';

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
      text.translateX = (clientX - kritzelViewportState.translateX) / kritzelViewportState.scale;
      text.translateY = (clientY - kritzelViewportState.translateY) / kritzelViewportState.scale;
      text.width = text.width / kritzelViewportState.scale;
      text.height = text.height / kritzelViewportState.scale;
      text.fontSize = 16;
      text.zIndex = this._store.currentZIndex;

      this.isWriting = true;

      this._store.state.objects = [...this._store.state.objects, text];
    }
  }
}
