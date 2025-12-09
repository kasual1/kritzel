import { KritzelLineOptions } from '../../interfaces/line-options.interface';
import { KritzelBaseObject } from './base-object.class';
import { KritzelPolygon } from '../../interfaces/polygon.interface';
import { KritzelGeometryHelper } from '../../helpers/geometry.helper';
import { KritzelPoint } from '../../interfaces/point.interface';
import { KritzelCore } from '../core/core.class';

export class KritzelLine extends KritzelBaseObject<SVGElement> {
  override __class__: string = 'KritzelLine';

  startX: number;
  startY: number;
  endX: number;
  endY: number;
  stroke: string;
  strokeWidth: number;
  scale: number = 1;
  options: KritzelLineOptions | undefined;

  isVisible: boolean = true;
  isDebugInfoVisible: boolean = true;
  isCompleted: boolean = false;

  private _adjustedPoints?: number[][] = null;

  get d(): string {
    return `M ${this.startX} ${this.startY} L ${this.endX} ${this.endY}`;
  }

  get viewBox(): string {
    return `${this.x} ${this.y} ${this.width} ${this.height}`;
  }

  constructor(config?: KritzelLineOptions) {
    super();
    this.options = config;
    this.startX = config?.startX ?? 0;
    this.startY = config?.startY ?? 0;
    this.endX = config?.endX ?? 0;
    this.endY = config?.endY ?? 0;
    this.translateX = config?.translateX ?? 0;
    this.translateY = config?.translateY ?? 0;
    this.scale = config?.scale ?? 1;
    this.strokeWidth = config?.strokeWidth ?? 4;
    this.stroke = config?.stroke ?? '#000000';
    this.updateDimensions();
  }

  static override create(core: KritzelCore, options?: KritzelLineOptions): KritzelLine {
    const object = new KritzelLine();

    object._core = core;
    object.id = object.generateId();
    object.workspaceId = core.store.state.activeWorkspace.id;
    object.options = options;
    object.startX = options?.startX ?? 0;
    object.startY = options?.startY ?? 0;
    object.endX = options?.endX ?? 0;
    object.endY = options?.endY ?? 0;
    object.translateX = options?.translateX ?? 0;
    object.translateY = options?.translateY ?? 0;
    object.scale = options?.scale ?? 1;
    object.strokeWidth = options?.strokeWidth ?? 4;
    object.stroke = options?.stroke ?? '#000000';
    object.zIndex = core.store.currentZIndex;
    object.updateDimensions();

    return object;
  }

  override resize(x: number | null, y: number | null, width: number, height: number): void {
    if (width <= 1 || height <= 1) {
      return;
    }

    const scaleX = width / this.width;
    const scaleY = height / this.height;

    // Scale the line endpoints
    this.startX = this.startX * scaleX;
    this.startY = this.startY * scaleY;
    this.endX = this.endX * scaleX;
    this.endY = this.endY * scaleY;

    // Recalculate dimensions from scaled endpoints
    const minX = Math.min(this.startX, this.endX) - this.strokeWidth / 2;
    const minY = Math.min(this.startY, this.endY) - this.strokeWidth / 2;
    const maxX = Math.max(this.startX, this.endX) + this.strokeWidth / 2;
    const maxY = Math.max(this.startY, this.endY) + this.strokeWidth / 2;

    this.width = maxX - minX;
    this.height = maxY - minY;
    this.x = minX;
    this.y = minY;

    // Set the new position
    this.translateX = x;
    this.translateY = y;

    this._adjustedPoints = null;

    this._core.store.state.objects.update(this);
  }

  override rotate(value: number): void {
    this.rotation = value;
    this._adjustedPoints = null;

    this._core.store.state.objects.update(this);
  }

  override move(startX: number, startY: number, endX: number, endY: number): void {
    const deltaX = (startX - endX) / this._core.store.state.scale;
    const deltaY = (startY - endY) / this._core.store.state.scale;

    this.translateX += deltaX;
    this.translateY += deltaY;

    this._adjustedPoints = null;

    this._core.store.state.objects.update(this);
  }

  override hitTest(x: number, y: number): boolean {
    const halfStroke = this.strokeWidth / this.scale / 2;

    if (this._adjustedPoints === null) {
      this._adjustedPoints = this.computeAdjustedPoints();
    }

    const p1 = this._adjustedPoints[0];
    const p2 = this._adjustedPoints[1];

    const distance = this.pointToLineSegmentDistance(x, y, p1[0], p1[1], p2[0], p2[1]);
    return distance <= halfStroke + 2; // Add a small tolerance for easier selection
  }

  override hitTestPolygon(polygon: KritzelPolygon): boolean {
    const halfStroke = this.strokeWidth / this.scale / 2;

    if (this._adjustedPoints === null) {
      this._adjustedPoints = this.computeAdjustedPoints();
    }

    const polyPoints: KritzelPoint[] = [
      { x: polygon.bottomLeft.x, y: polygon.bottomLeft.y },
      { x: polygon.bottomRight.x, y: polygon.bottomRight.y },
      { x: polygon.topRight.x, y: polygon.topRight.y },
      { x: polygon.topLeft.x, y: polygon.topLeft.y },
    ];

    // Check if any endpoint is inside the polygon
    for (const [px, py] of this._adjustedPoints) {
      if (KritzelGeometryHelper.isPointInPolygon({ x: px, y: py }, polyPoints)) {
        return true;
      }
    }

    // Check if any polygon vertex is on the line
    for (const pt of polyPoints) {
      if (this.hitTest(pt.x, pt.y)) {
        return true;
      }
    }

    // Check if line intersects any polygon edge
    const p1 = { x: this._adjustedPoints[0][0], y: this._adjustedPoints[0][1] };
    const p2 = { x: this._adjustedPoints[1][0], y: this._adjustedPoints[1][1] };

    for (let j = 0; j < polyPoints.length; j++) {
      const q1 = polyPoints[j];
      const q2 = polyPoints[(j + 1) % polyPoints.length];

      if (KritzelGeometryHelper.intersectLines(p1, p2, q1, q2)) {
        return true;
      }

      // Check distance from polygon edges to line segment
      const d1 = this.pointToLineSegmentDistance(q1.x, q1.y, p1.x, p1.y, p2.x, p2.y);
      const d2 = this.pointToLineSegmentDistance(q2.x, q2.y, p1.x, p1.y, p2.x, p2.y);
      const d3 = this.pointToLineSegmentDistance(p1.x, p1.y, q1.x, q1.y, q2.x, q2.y);
      const d4 = this.pointToLineSegmentDistance(p2.x, p2.y, q1.x, q1.y, q2.x, q2.y);

      const minD = Math.min(d1, d2, d3, d4);
      if (minD <= halfStroke) {
        return true;
      }
    }

    return false;
  }

  override updatePosition(x: number, y: number): void {
    this.translateX = x;
    this.translateY = y;
    this._adjustedPoints = null;
    this._core.store.state.objects.update(this);
  }

  /**
   * Updates a specific endpoint of the line (start or end).
   * The coordinates are in viewBox-local space (relative to x, y origin).
   * This method recalculates the bounding box dimensions.
   *
   * @param handleType - Which endpoint to update: 'start' or 'end'
   * @param newX - New X coordinate in viewBox-local space
   * @param newY - New Y coordinate in viewBox-local space
   */
  updateEndpoint(handleType: 'start' | 'end', newX: number, newY: number): void {
    // Update the appropriate endpoint
    if (handleType === 'start') {
      this.startX = newX;
      this.startY = newY;
    } else {
      this.endX = newX;
      this.endY = newY;
    }

    // Recalculate the bounding box (viewBox dimensions)
    const halfStroke = this.strokeWidth / 2;

    const minX = Math.min(this.startX, this.endX) - halfStroke;
    const minY = Math.min(this.startY, this.endY) - halfStroke;
    const maxX = Math.max(this.startX, this.endX) + halfStroke;
    const maxY = Math.max(this.startY, this.endY) + halfStroke;

    // Calculate the change in origin
    const deltaX = minX - this.x;
    const deltaY = minY - this.y;

    // Update viewBox dimensions
    this.x = minX;
    this.y = minY;
    this.width = maxX - minX;
    this.height = maxY - minY;

    // Adjust translateX/Y to compensate for the origin shift
    // so the line stays visually in the same position
    this.translateX += deltaX / this.scale;
    this.translateY += deltaY / this.scale;

    // Clear cached adjusted points
    this._adjustedPoints = null;

    this._core.store.state.objects.update(this);
  }

  private computeAdjustedPoints(): number[][] {
    const points = [
      [this.startX, this.startY],
      [this.endX, this.endY],
    ];

    const angle = this.rotation;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const xs = points.map(p => p[0]);
    const ys = points.map(p => p[1]);
    const pivot = {
      x: (Math.min(...xs) + Math.max(...xs)) / 2,
      y: (Math.min(...ys) + Math.max(...ys)) / 2,
    };

    const { x: cx, y: cy } = pivot;

    const rotatedPoints = points.map(([x, y]) => {
      const dx = x - cx;
      const dy = y - cy;
      return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
    });

    return rotatedPoints.map(([px, py]) => [Math.abs(px - this.x) / this.scale + this.translateX, Math.abs(py - this.y) / this.scale + this.translateY]);
  }

  private pointToLineSegmentDistance(x: number, y: number, x1: number, y1: number, x2: number, y2: number): number {
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    if (len_sq !== 0) {
      param = dot / len_sq;
    }

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private updateDimensions(): void {
    const points = [
      [this.startX, this.startY],
      [this.endX, this.endY],
    ];

    const rotatedPoints = points.map(([x, y]) => {
      const rotatedX = x * Math.cos(this.rotation) - y * Math.sin(this.rotation);
      const rotatedY = x * Math.sin(this.rotation) + y * Math.cos(this.rotation);
      return [rotatedX, rotatedY];
    });

    const minX = Math.min(...rotatedPoints.map(p => p[0] - this.strokeWidth / 2));
    const minY = Math.min(...rotatedPoints.map(p => p[1] - this.strokeWidth / 2));

    const maxX = Math.max(...rotatedPoints.map(p => p[0] + this.strokeWidth / 2));
    const maxY = Math.max(...rotatedPoints.map(p => p[1] + this.strokeWidth / 2));

    this.width = maxX - minX;
    this.height = maxY - minY;

    this.x = minX;
    this.y = minY;

    this.translateX = (this.x + this.translateX) / this.scale;
    this.translateY = (this.y + this.translateY) / this.scale;
  }
}
