import { KritzelEventHelper } from '../../helpers/event.helper';
import { BatchCommand } from '../commands/batch.command';
import { RemoveObjectCommand } from '../commands/remove-object.command';
import { KritzelBaseTool } from './base-tool.class';
import { KritzelCore } from '../core/core.class';

export class KritzelEraserTool extends KritzelBaseTool {
  touchStartTimeout: any = null;

  constructor(core: KritzelCore) {
    super(core);
  }

  handlePointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      if (KritzelEventHelper.isLeftClick(event)) {
        this._core.store.state.isErasing = true;
      }
    }

    if (event.pointerType === 'touch') {
      this.touchStartTimeout = setTimeout(() => {
        if (this._core.store.state.pointers.size === 1 && !this._core.store.state.isScaling) {
          this._core.store.state.isErasing = true;
        }
      }, 80);
    }
  }

  handlePointerMove(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      if (this._core.store.state.isErasing) {
        
        const selectedObjects = this._core.getObjectsFromPointerEvent(event, '.object');

        if (selectedObjects.length === 0) return;

        const x = this._core.store.state.pointerX;
        const y = this._core.store.state.pointerY;

        selectedObjects.forEach(selectedObject => {
          selectedObject.markedForRemoval = selectedObject.hitTest(x, y);
        });

        this._core.rerender();
      }
    }

    if (event.pointerType === 'touch') {
      if (this._core.store.state.pointers.size === 1 && this._core.store.state.isErasing) {
        const shadowRoot = this._core.store.state.host?.shadowRoot;
        if (!shadowRoot) return;
        
        const selectedObjects = this._core.getObjectsFromPointerEvent(event, '.object');

        if (selectedObjects.length === 0) return;

        const x = this._core.store.state.pointerX;
        const y = this._core.store.state.pointerY;

        selectedObjects.forEach(selectedObject => {
          selectedObject.markedForRemoval = selectedObject.hitTest(x, y);
        });

        this._core.rerender();
      }
    }
  }

  handlePointerUp(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      if (this._core.store.state.isErasing) {
        const removeCommands = this._core.store.allObjects.filter(object => object.markedForRemoval).map(object => {
          object.markedForRemoval = false;
          return new RemoveObjectCommand(this._core, this, object);
        });

        if (removeCommands.length > 0) {
          this._core.history.executeCommand(new BatchCommand(this._core, this, removeCommands));
        }

        this._core.store.state.isErasing = false;
      }
    }

    if (event.pointerType === 'touch') {
      clearTimeout(this.touchStartTimeout);

      if (this._core.store.state.isErasing) {
        const removeCommands = this._core.store.allObjects
          .filter(object => object.markedForRemoval)
          .map(object => {
            object.markedForRemoval = false;
            return new RemoveObjectCommand(this._core, this, object);
          });

        if (removeCommands.length > 0) {
          this._core.history.executeCommand(new BatchCommand(this._core, this, removeCommands));
        }

        this._core.store.state.isErasing = false;
      }
    }
  }
}
