import { KritzelClickHelper } from '../../helpers/click.helper';
import { KritzelBoundingBox } from '../../interfaces/bounding-box.interface';
import { KritzelSelectionState } from '../../interfaces/selection-state.interface';
import { kritzelEngineState, findObjectById } from '../../stores/engine.store';
import { kritzelViewportState } from '../../stores/viewport.store';
import { KrtizelSelectionBox } from '../objects/selection-box.class';
import { KrtizelSelectionGroup } from '../objects/selection-group.class';

export class KritzelSelectionHandler {
  selectionState: KritzelSelectionState;

  dragStartX: number;
  dragStartY: number;

  constructor(selectionState: KritzelSelectionState) {
    this.selectionState = selectionState;
  }

  handleMouseDown(event) {
    if (KritzelClickHelper.isLeftClick(event)) {
      const path = event.composedPath() as HTMLElement[];
      const objectElement = path.find(element => element.classList && element.classList.contains('object'));
      const isHandleSelected = path.find(element => element.classList && element.classList.contains('selection-handle'));
      const isRotationHandleSelected = path.find(element => element.classList && element.classList.contains('rotation-handle'));

      const selectedObject = objectElement ? findObjectById(objectElement.id) : null;

      if (selectedObject?.selected && !isHandleSelected && !isRotationHandleSelected) {
        console.log('SELECTIONGROUP DOWN');

        this.selectionState.selectionGroup = selectedObject as KrtizelSelectionGroup;
        this.selectionState.isDragging = true;
        this.dragStartX = event.clientX;
        this.dragStartY = event.clientY;
      }

      if (!selectedObject) {
        console.log('SELECTIONBOX DOWN');
        kritzelEngineState.objects = [...kritzelEngineState.objects.filter(o => !(o instanceof KrtizelSelectionGroup) && !(o instanceof KrtizelSelectionBox))];

        const { clientX, clientY } = event;
        const selectionBox = new KrtizelSelectionBox();

        this.dragStartX = (clientX - kritzelViewportState.translateX) / kritzelViewportState.scale;
        this.dragStartY = (clientY - kritzelViewportState.translateY) / kritzelViewportState.scale;

        selectionBox.translateX = this.dragStartX;
        selectionBox.translateY = this.dragStartY;
        this.selectionState.selectionGroup = null;
        this.selectionState.selectionBox = selectionBox;
        this.selectionState.isDragging = true;

        console.log(this.dragStartX, this.dragStartY);

        kritzelEngineState.objects = [...kritzelEngineState.objects, selectionBox];
      }
    }
  }

  handleMouseMove(event) {
    if (this.selectionState.isDragging && this.selectionState.selectionGroup) {
      console.log('SELECTIONGROUP MOVE');

      this.selectionState.selectionGroup.move(event.clientX, event.clientY, this.dragStartX, this.dragStartY);
      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;

      kritzelEngineState.objects = [...kritzelEngineState.objects];
    }

    if (this.selectionState.isDragging && this.selectionState.selectionBox) {
      console.log('SELECTIONBOX MOVE');
      const { clientX, clientY } = event;

      const x = (clientX - kritzelViewportState.translateX) / kritzelViewportState.scale;
      const y = (clientY - kritzelViewportState.translateY) / kritzelViewportState.scale;

      const width = x - this.dragStartX;
      const height = y - this.dragStartY;

      const objectBox: KritzelBoundingBox = {
        x: width < 0 ? x : this.dragStartX,
        y: height < 0 ? y : this.dragStartY,
        width: Math.abs(width),
        height: Math.abs(height),
      };

      this.selectionState.selectionBox.width = Math.abs(objectBox.width);
      this.selectionState.selectionBox.height = Math.abs(objectBox.height);

      this.selectionState.selectionBox.translateX = objectBox.x;
      this.selectionState.selectionBox.translateY = objectBox.y;

      kritzelEngineState.objects = [...kritzelEngineState.objects];

      kritzelEngineState.objects
        .filter(o => !(o instanceof KrtizelSelectionBox))
        .forEach(object => {
          if (this.isBoundingBoxOverlapping(objectBox, object.boundingBox)) {
            object.selected = true;
          } else {
            object.selected = false;
          }
        });
    }
  }

  handleMouseUp(event) {
    if (this.selectionState.isDragging) {
      console.log('SELECTION UP');

      this.selectionState.isDragging = false;
      this.selectionState.selectionGroup = null;

      const selectedObjects = kritzelEngineState.objects.filter(o => !(o instanceof KrtizelSelectionGroup)).filter(o => o.selected);

      if (selectedObjects.length > 0) {
        const selectionGroup = new KrtizelSelectionGroup();
        selectedObjects.forEach(o => {
          o.selected = false;
          selectionGroup.addOrRemove(o);
        });
        selectionGroup.selected = true;

        this.selectionState.selectionBox = null;

        kritzelEngineState.objects = [...kritzelEngineState.objects.filter(o => !(o instanceof KrtizelSelectionBox)), selectionGroup];

        return;
      }

      kritzelEngineState.objects = [...kritzelEngineState.objects.filter(o => !(o instanceof KrtizelSelectionBox))];
    }

    if (KritzelClickHelper.isLeftClick(event) && !this.selectionState.isRotating) {
      const path = event.composedPath() as HTMLElement[];
      const selectedObject = path.find(element => element.classList && element.classList.contains('object'));

      let noObjectSelected = true;

      if (selectedObject) {
        for (const object of kritzelEngineState.objects) {
          if (selectedObject.id === object.id) {
            if (this.selectionState.isCtrlKeyPressed === false) {
              this.selectionState.selectionGroup = null;
            }

            if (this.selectionState.selectionGroup === null) {
              this.selectionState.selectionGroup = new KrtizelSelectionGroup();
            }

            if (object instanceof KrtizelSelectionGroup === false) {
              this.selectionState.selectionGroup.addOrRemove(object);
              this.selectionState.selectionGroup.selected = true;
              noObjectSelected = false;

              kritzelEngineState.objects = [...kritzelEngineState.objects.filter(o => !(o instanceof KrtizelSelectionGroup)), this.selectionState.selectionGroup];
            }

            break;
          }
        }
      }

      if (noObjectSelected === true) {
        this.selectionState.selectionGroup = null;
        kritzelEngineState.objects = [...kritzelEngineState.objects.filter(o => !(o instanceof KrtizelSelectionGroup))];
      }
    }
  }

  private isBoundingBoxOverlapping(box1: { x: number; y: number; width: number; height: number }, box2: { x: number; y: number; width: number; height: number }): boolean {
    return box1.x < box2.x + box2.width && box1.x + box1.width > box2.x && box1.y < box2.y + box2.height && box1.y + box1.height > box2.y;
  }
}
