import { KritzelClickHelper } from '../../helpers/click.helper';
import { KritzelStore } from '../store.class';
import { BatchCommand } from '../commands/batch.command';
import { RemoveObjectCommand } from '../commands/remove-object.command';
import { KritzelBaseTool } from './base-tool.class';

export class KritzelEraserTool extends KritzelBaseTool {
  name: string = 'eraser';

  constructor(store: KritzelStore) {
    super(store);
  }

  handleMouseDown(event: MouseEvent): void {
    if (KritzelClickHelper.isLeftClick(event)) {
      this._store.state.isErasing = true;
    }
  }

  handleMouseMove(event: MouseEvent): void {
    if (this._store.state.isErasing) {
      const shadowRoot = this._store.state.host?.shadowRoot;
      if (!shadowRoot) return;

      const elementAtPoint = shadowRoot.elementFromPoint(event.clientX, event.clientY);
      if (!elementAtPoint) return;

      const selectedObject = elementAtPoint.closest('.object') as HTMLElement | null;

      if (selectedObject) {
        for (const object of this._store.allObjects) {
          if (selectedObject.id === object.id) {
            object.markedForRemoval = true;
          }
        }
      }

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
    this._store.state.isErasing = true;
  }

  handleTouchMove(event: TouchEvent): void {
    if (this._store.state.isErasing) {
      const shadowRoot = this._store.state.host?.shadowRoot;
      if (!shadowRoot) return;

      const touch = event.touches[0];
      const elementAtPoint = shadowRoot.elementFromPoint(touch.clientX, touch.clientY);
      if (!elementAtPoint) return;

      const selectedObject = elementAtPoint.closest('.object') as HTMLElement | null;

      if (selectedObject) {
        for (const object of this._store.allObjects) {
          if (selectedObject.id === object.id) {
            object.markedForRemoval = true;
          }
        }
      }

      this._store.rerender();
    }
  }

  handleTouchEnd(_event: TouchEvent): void {
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
