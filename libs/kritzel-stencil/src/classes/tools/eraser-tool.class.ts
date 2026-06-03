import { KritzelEventHelper } from '../../helpers/event.helper';
import { KritzelBaseTool } from './base-tool.class';
import { KritzelCore } from '../core/core.class';

/**
 * Eraser tool for removing objects from the canvas.
 * Objects touched by the eraser during a drag gesture are marked for removal
 * and deleted when the gesture completes. Supports mouse, touch, and pen input.
 */
export class KritzelEraserTool extends KritzelBaseTool {
  override toolType = 'eraser' as const;

  /** Timeout handle for delayed touch start activation to prevent accidental erasing */
  touchStartTimeout: any = null;

  /**
   * Creates a new instance of KritzelEraserTool.
   * @param core - The KritzelCore instance that provides access to application state and functionality
   */
  constructor(core: KritzelCore) {
    super(core);
  }

  /**
   * Handles pointer down events to start the erasing gesture.
   * For mouse input, immediately activates erasing on left-click.
   * For touch/pen input, uses a delayed activation to prevent accidental erasing.
   * @param event - The PointerEvent containing pointer position and input type information
   */
  handlePointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      if (KritzelEventHelper.isLeftClick(event)) {
        this._core.store.state.isErasing = true;
      }
    }

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      this.touchStartTimeout = setTimeout(() => {
        if (this._core.store.state.pointers.size === 1 && !this._core.store.state.isScaling) {
          this._core.store.state.isErasing = true;
        }
      }, 80);
    }
  }

  /**
   * Handles pointer move events to mark objects for removal during erasing.
   * Performs hit testing on objects under the pointer and marks them for removal.
   * Objects are visually indicated as being erased but not yet removed from the canvas.
   * @param event - The PointerEvent containing the current pointer position
   */
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

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
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

  /**
   * Handles pointer up events to complete the erasing gesture.
   * Removes all objects that were marked for removal during the gesture.
   * Clears the erasing state and emits an objects change event if any objects were removed.
   * @param event - The PointerEvent indicating the end of the erasing gesture
   */
  handlePointerUp(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      if (this._core.store.state.isErasing) {
        const objectsToRemove = this._core.store.allObjects.filter(object => object.markedForRemoval);

        if (objectsToRemove.length > 0) {
          // Seal the previous undo step so create+delete of the same object
          // (e.g. just-drawn shape) don't collapse into a no-op on undo.
          this._core.store.objects.stopUndoCapturing();
          // Group all removals from this sweep into a single undo step.
          this._core.store.objects.transaction(() => {
            objectsToRemove.forEach(object => {
              object.markedForRemoval = false;
              this._core.removeObject(object);
            });
          });
          this._core.rerender();
        }

        this._core.store.state.isErasing = false;

        this._core.engine.emitObjectsChange();
        if (objectsToRemove.length > 0) {
          this._core.engine.emitObjectsRemoved(objectsToRemove);
          this._core.store.objects.stopUndoCapturing();
        }
      }
    }

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      clearTimeout(this.touchStartTimeout);

      if (this._core.store.state.isErasing) {
        const objectsToRemove = this._core.store.allObjects.filter(object => object.markedForRemoval);

        if (objectsToRemove.length > 0) {
          // Seal the previous undo step so create+delete of the same object
          // (e.g. just-drawn shape) don't collapse into a no-op on undo.
          this._core.store.objects.stopUndoCapturing();
          // Group all removals from this sweep into a single undo step.
          this._core.store.objects.transaction(() => {
            objectsToRemove.forEach(object => {
              object.markedForRemoval = false;
              this._core.removeObject(object);
            });
          });
          this._core.rerender();
        }

        this._core.store.state.isErasing = false;

        this._core.engine.emitObjectsChange();
        if (objectsToRemove.length > 0) {
          this._core.engine.emitObjectsRemoved(objectsToRemove);
          this._core.store.objects.stopUndoCapturing();
        }
      }
    }
  }
}
