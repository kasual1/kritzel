import { KritzelEventHelper } from '../../helpers/event.helper';
import { KritzelStore } from '../store.class';
import { BatchCommand } from '../commands/batch.command';
import { RemoveObjectCommand } from '../commands/remove-object.command';
import { KritzelBaseTool } from './base-tool.class';

export class KritzelEraserTool extends KritzelBaseTool {
  touchStartTimeout: any = null;

  constructor(store: KritzelStore) {
    super(store);
  }

  handleMouseDown(event: MouseEvent): void {
    if (KritzelEventHelper.isLeftClick(event)) {
      this._store.state.isErasing = true;
    }
  }

  handleMouseMove(event: MouseEvent): void {
    if (this._store.state.isErasing) {
      const shadowRoot = this._store.state.host?.shadowRoot;
      if (!shadowRoot) return;

      const selectedObject = this._store.getObjectFromPointerEvent(event, '.object');
      if (!selectedObject) return;

      selectedObject.markedForRemoval = true;

      this._store.rerender();
    }
  }

  handleMouseUp(_event: MouseEvent): void {
    if (this._store.state.isErasing) {
      const removeCommands = this._store.allObjects
        .filter(object => object.markedForRemoval)
        .map(object => {
          object.markedForRemoval = false;
          return new RemoveObjectCommand(this._store, this, object);
        });

      if (removeCommands.length > 0) {
        this._store.history.executeCommand(new BatchCommand(this._store, this, removeCommands));
      }

      this._store.state.isErasing = false;
    }
  }

  handleTouchStart(_event: TouchEvent): void {
    this.touchStartTimeout = setTimeout(() => {
      if (this._store.state.touchCount === 1 && !this._store.state.isScaling) {
        this._store.state.isErasing = true;
      }
    }, 80);
  }

  handleTouchMove(event: TouchEvent): void {
    if (this._store.state.touchCount === 1 && this._store.state.isErasing) {
      const shadowRoot = this._store.state.host?.shadowRoot;
      if (!shadowRoot) return;

      const selectedObject = this._store.getObjectFromPointerEvent(event, '.object');
      if (!selectedObject) return;

      selectedObject.markedForRemoval = true;

      this._store.rerender();
    }
  }

  handleTouchEnd(_event: TouchEvent): void {
    clearTimeout(this.touchStartTimeout);

    if (this._store.state.isErasing) {
      const removeCommands = this._store.allObjects
        .filter(object => object.markedForRemoval)
        .map(object => {
          object.markedForRemoval = false;
          return new RemoveObjectCommand(this._store, this, object);
        });

      if (removeCommands.length > 0) {
        this._store.history.executeCommand(new BatchCommand(this._store, this, removeCommands));
      }

      this._store.state.isErasing = false;
    }
  }
}
