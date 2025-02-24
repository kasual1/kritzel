import { KritzelClickHelper } from '../../helpers/click.helper';
import { KritzelBoundingBox } from '../../interfaces/bounding-box.interface';
import { KritzelSelectionState } from '../../interfaces/selection-state.interface';
import { kritzelEngineState, findObjectById } from '../../stores/engine.store';
import { kritzelViewportState } from '../../stores/viewport.store';
import { KrtizelSelectionBox } from '../objects/selection-box.class';
import { KrtizelSelectionGroup } from '../objects/selection-group.class';
interface Point {
  x: number;
  y: number;
}

interface Polygon {
  bottomLeft: Point;
  bottomRight: Point;
  topLeft: Point;
  topRight: Point;
}
export class KritzelSelectionHandler {
  selectionState: KritzelSelectionState;

  dragStartX: number;
  dragStartY: number;

  constructor(selectionState: KritzelSelectionState) {
    this.selectionState = selectionState;
  }

  handleMouseDown(event) {
    if (KritzelClickHelper.isLeftClick(event)) {
      const selectedObject = this.getSelectedObject(event);
      const isResizeHandleSelected = this.isHandleSelected(event);
      const isRotationHandleSelected = this.isRotationHandleSelected(event);

      if (!selectedObject?.selected) {
        this.startSelection(event);
        this.updateSelection(event);
        this.stopSelection();
        this.addSelectedObjectsToSelectionGroup();
      }

      if (selectedObject?.selected && !isResizeHandleSelected && !isRotationHandleSelected) {
        this.startDragging(selectedObject, event);
      }

      if (!selectedObject) {
        this.startSelection(event);
      }
    }
  }

  handleMouseMove(event) {
    if (this.selectionState.isDragging && this.selectionState.selectionGroup) {
      this.updateDragging(event);
    }

    if (this.selectionState.isSelecting) {
      this.updateSelection(event);
    }
  }

  handleMouseUp(_event) {
    if (this.selectionState.isDragging) {
      this.stopDragging();
    }

    if (this.selectionState.isSelecting) {
      this.stopSelection();
      this.addSelectedObjectsToSelectionGroup();
      return;
    }
  }

  private getSelectedObject(event: MouseEvent): KrtizelSelectionGroup | null {
    const path = event.composedPath() as HTMLElement[];
    const objectElement = path.find(element => element.classList && element.classList.contains('object'));
    const object = findObjectById(objectElement?.id);

    if (!object) {
      return null;
    }

    if (object instanceof KrtizelSelectionGroup) {
      return object;
    } else {
      const group = new KrtizelSelectionGroup();
      group.translateX = 0;
      group.translateY = 0;
      group.addOrRemove(object);
      return group;
    }
  }

  private isHandleSelected(event: MouseEvent): boolean {
    const path = event.composedPath() as HTMLElement[];
    return !!path.find(element => element.classList && element.classList.contains('selection-handle'));
  }

  private isRotationHandleSelected(event: MouseEvent): boolean {
    const path = event.composedPath() as HTMLElement[];
    return !!path.find(element => element.classList && element.classList.contains('rotation-handle'));
  }

  private startDragging(selectedObject: KrtizelSelectionGroup, event: MouseEvent): void {
    this.selectionState.selectionGroup = selectedObject;
    this.selectionState.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
  }

  private updateDragging(event: MouseEvent): void {
    this.selectionState.selectionGroup.move(event.clientX, event.clientY, this.dragStartX, this.dragStartY);
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;

    kritzelEngineState.objects = [...kritzelEngineState.objects];
  }

  private stopDragging(): void {
    this.selectionState.isDragging = false;
    this.selectionState.selectionGroup = null;
  }

  private startSelection(event: MouseEvent): void {
    const { clientX, clientY } = event;
    const selectionBox = new KrtizelSelectionBox();
    this.dragStartX = (clientX - kritzelViewportState.translateX) / kritzelViewportState.scale;
    this.dragStartY = (clientY - kritzelViewportState.translateY) / kritzelViewportState.scale;
    selectionBox.translateX = this.dragStartX;
    selectionBox.translateY = this.dragStartY;
    this.selectionState.selectionGroup = null;
    this.selectionState.selectionBox = selectionBox;
    this.selectionState.isSelecting = true;

    kritzelEngineState.objects = [...kritzelEngineState.objects.filter(o => !(o instanceof KrtizelSelectionGroup) && !(o instanceof KrtizelSelectionBox)), selectionBox];
  }

  private updateSelection(event: MouseEvent): void {
    const { clientX, clientY } = event;
    const selectionBox = this.selectionState.selectionBox;
    const currentX = (clientX - kritzelViewportState.translateX) / selectionBox.scale;
    const currentY = (clientY - kritzelViewportState.translateY) / selectionBox.scale;

    if (selectionBox) {
      selectionBox.width = Math.abs(currentX - this.dragStartX) * selectionBox.scale;
      selectionBox.height = Math.abs(currentY - this.dragStartY) * selectionBox.scale;
      selectionBox.translateX = Math.min(currentX, this.dragStartX);
      selectionBox.translateY = Math.min(currentY, this.dragStartY);
    }

    this.updateSelectedObjects();

    kritzelEngineState.objects = [...kritzelEngineState.objects];
  }

  private updateSelectedObjects(): void {
    const scale = kritzelViewportState.scale;

    const objectBox: KritzelBoundingBox = {
      x: this.selectionState.selectionBox.translateX,
      y: this.selectionState.selectionBox.translateY,
      width: this.selectionState.selectionBox.width / scale,
      height: this.selectionState.selectionBox.height / scale,
    };

    kritzelEngineState.objects
      .filter(o => !(o instanceof KrtizelSelectionBox))
      .forEach(object => {
        const objectPolygon = this.applyRotationToBox(object.translateX, object.translateY, object.totalWidth, object.totalHeight, object.rotation);
        const selectionBoxPolygon = this.applyRotationToBox(
          this.selectionState.selectionBox.translateX,
          this.selectionState.selectionBox.translateY,
          this.selectionState.selectionBox.width,
          this.selectionState.selectionBox.height,
          0,
        );

        console.log(objectPolygon);
        console.log(selectionBoxPolygon);

        if (this.doPolygonsIntersect(objectPolygon, selectionBoxPolygon)) {
          object.selected = true;
        } else {
          object.selected = false;
        }
      });
  }

  private applyRotationToBox(x: number, y: number, width: number, height: number, rotation): Polygon {
    const cx = x + width / 2;
    const cy = y + height / 2;
    const angle = rotation;

    const corners = {
      topLeft: { x, y },
      topRight: { x: x + width, y },
      bottomRight: { x: x + width, y: y + height },
      bottomLeft: { x, y: y + height },
    };

    const rotatedCorners = Object.keys(corners).reduce((acc, key) => {
      const corner = corners[key];
      const rotatedX = Math.cos(angle) * (corner.x - cx) - Math.sin(angle) * (corner.y - cy) + cx;
      const rotatedY = Math.sin(angle) * (corner.x - cx) + Math.cos(angle) * (corner.y - cy) + cy;
      acc[key] = { x: rotatedX, y: rotatedY };
      return acc;
    }, {});

    return rotatedCorners as Polygon;
  }

  private doPolygonsIntersect(polygon1: Polygon, polygon2: Polygon): boolean {
    // 1. Convert polygons to array of points for easier processing
    const points1 = [polygon1.bottomLeft, polygon1.bottomRight, polygon1.topRight, polygon1.topLeft];
    const points2 = [polygon2.bottomLeft, polygon2.bottomRight, polygon2.topRight, polygon2.topLeft];

    // 2. Check if any point of polygon1 is inside polygon2
    for (const point of points1) {
      if (this.isPointInPolygon(point, points2)) {
        return true;
      }
    }

    // 3. Check if any point of polygon2 is inside polygon1
    for (const point of points2) {
      if (this.isPointInPolygon(point, points1)) {
        return true;
      }
    }

    // 4. Check for edge intersections (more complex)
    for (let i = 0; i < points1.length; i++) {
      const p1a = points1[i];
      const p1b = points1[(i + 1) % points1.length]; // Wrap around to the first point

      for (let j = 0; j < points2.length; j++) {
        const p2a = points2[j];
        const p2b = points2[(j + 1) % points2.length];

        if (this.intersectLines(p1a, p1b, p2a, p2b)) {
          return true;
        }
      }
    }

    return false; // No intersection found
  }

  isPointInPolygon(point: Point, polygon: Point[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x,
        yi = polygon[i].y;
      const xj = polygon[j].x,
        yj = polygon[j].y;

      const intersect = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  intersectLines(p1a: Point, p1b: Point, p2a: Point, p2b: Point): boolean {
    const det = (p1b.x - p1a.x) * (p2b.y - p2a.y) - (p1b.y - p1a.y) * (p2b.x - p2a.x);
    if (det === 0) {
      return false; // Lines are parallel
    }

    const t = ((p2a.x - p1a.x) * (p2b.y - p2a.y) - (p2a.y - p1a.y) * (p2b.x - p2a.x)) / det;
    const u = -((p1a.x - p2a.x) * (p1b.y - p1a.y) - (p1a.y - p2a.y) * (p1b.x - p1a.x)) / det;

    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  }

  private stopSelection(): void {
    this.selectionState.selectionBox = null;
    this.selectionState.isSelecting = false;
  }

  private addSelectedObjectsToSelectionGroup(): void {
    const selectedObjects = kritzelEngineState.objects.filter(o => !(o instanceof KrtizelSelectionGroup)).filter(o => o.selected);

    if (selectedObjects.length > 0) {
      this.selectionState.selectionGroup = new KrtizelSelectionGroup();
      selectedObjects.forEach(o => {
        o.selected = false;
        this.selectionState.selectionGroup.addOrRemove(o);
      });
      this.selectionState.selectionGroup.selected = true;

      if (this.selectionState.selectionGroup.length === 1) {
        this.selectionState.selectionGroup.rotation = this.selectionState.selectionGroup.objects[0].rotation;
      }

      kritzelEngineState.objects = [...kritzelEngineState.objects.filter(o => !(o instanceof KrtizelSelectionBox)), this.selectionState.selectionGroup];
    } else {
      kritzelEngineState.objects = [...kritzelEngineState.objects.filter(o => !(o instanceof KrtizelSelectionBox))];
    }
  }

  private isBoundingBoxOverlapping(box1: { x: number; y: number; width: number; height: number }, box2: { x: number; y: number; width: number; height: number }): boolean {
    return box1.x < box2.x + box2.width && box1.x + box1.width > box2.x && box1.y < box2.y + box2.height && box1.y + box1.height > box2.y;
  }
}
