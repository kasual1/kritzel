import { KritzelLineOptions } from '../../interfaces/line-options.interface';
import { KritzelBaseObject } from './base-object.class';
import { KritzelPolygon } from '../../interfaces/polygon.interface';
import { KritzelGeometryHelper } from '../../helpers/geometry.helper';
import { KritzelPoint } from '../../interfaces/point.interface';
import { KritzelCore } from '../core/core.class';
import { LineAnchor } from '../../interfaces/anchor.interface';
import { ArrowHeadStyle, LineArrowConfig } from '../../interfaces/arrow-head.interface';

export class KritzelLine extends KritzelBaseObject<SVGElement> {
  override __class__: string = 'KritzelLine';

  startX: number;
  startY: number;
  endX: number;
  endY: number;
  controlX?: number;
  controlY?: number;
  stroke: string;
  strokeWidth: number;
  scale: number = 1;
  options: KritzelLineOptions | undefined;

  /** Anchor connection for the start point of the line */
  startAnchor?: LineAnchor;
  /** Anchor connection for the end point of the line */
  endAnchor?: LineAnchor;
  /** Arrow head configuration for start and end of line */
  arrows?: LineArrowConfig;

  isVisible: boolean = true;
  isDebugInfoVisible: boolean = true;
  isCompleted: boolean = false;

  private _adjustedPoints?: number[][] = null;

  get d(): string {
    if (this.controlX !== undefined && this.controlY !== undefined) {
      return `M ${this.startX} ${this.startY} Q ${this.controlX} ${this.controlY} ${this.endX} ${this.endY}`;
    }
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
    this.controlX = config?.controlX;
    this.controlY = config?.controlY;
    this.translateX = config?.translateX ?? 0;
    this.translateY = config?.translateY ?? 0;
    this.scale = config?.scale ?? 1;
    this.strokeWidth = config?.strokeWidth ?? 4;
    this.stroke = config?.stroke ?? '#000000';
    this.startAnchor = config?.startAnchor;
    this.endAnchor = config?.endAnchor;
    this.arrows = config?.arrows;
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
    object.controlX = options?.controlX;
    object.controlY = options?.controlY;
    object.translateX = options?.translateX ?? 0;
    object.translateY = options?.translateY ?? 0;
    object.scale = options?.scale ?? 1;
    object.strokeWidth = options?.strokeWidth ?? 4;
    object.stroke = options?.stroke ?? '#000000';
    object.startAnchor = options?.startAnchor;
    object.endAnchor = options?.endAnchor;
    object.arrows = options?.arrows;
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

    if (this.controlX !== undefined && this.controlY !== undefined) {
      this.controlX = this.controlX * scaleX;
      this.controlY = this.controlY * scaleY;
    }

    // Recalculate dimensions from scaled endpoints
    const { minX, minY, maxX, maxY } = this.calculateBoundingBox();

    this.width = maxX - minX;
    this.height = maxY - minY;
    this.x = minX;
    this.y = minY;

    // Set the new position
    this.translateX = x;
    this.translateY = y;

    this._adjustedPoints = null;

    this._core.store.state.objects.update(this);

    // Update anchors after the line is updated
    this._core.anchorManager.updateAnchorsForObject(this.id);

    if (this.startAnchor) {
      this._core.anchorManager.updateAnchorsForObject(this.startAnchor.objectId);
    }
    if (this.endAnchor) {
      this._core.anchorManager.updateAnchorsForObject(this.endAnchor.objectId);
    }
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

    // If the line is anchored, we need to ensure the anchored endpoints stay at the target
    if (this.startAnchor) {
      this._core.anchorManager.updateAnchorsForObject(this.startAnchor.objectId);
    }
    if (this.endAnchor) {
      this._core.anchorManager.updateAnchorsForObject(this.endAnchor.objectId);
    }

    this._adjustedPoints = null;

    this._core.store.state.objects.update(this);
  }

  override hitTest(x: number, y: number): boolean {
    const halfStroke = this.strokeWidth / this.scale / 2;

    if (this._adjustedPoints === null) {
      this._adjustedPoints = this.computeAdjustedPoints();
    }

    // For curved lines, use distance to the Bezier curve
    if (this.controlX !== undefined && this.controlY !== undefined) {
      const distance = this.pointToBezierDistance(x, y);
      return distance <= halfStroke + 2;
    }

    // For straight lines, use distance to line segment
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

    // Check if any polygon vertex is on the line/curve
    for (const pt of polyPoints) {
      if (this.hitTest(pt.x, pt.y)) {
        return true;
      }
    }

    // For curved lines, sample points along the curve and check if any are inside the polygon
    if (this.controlX !== undefined && this.controlY !== undefined) {
      const p0 = this._adjustedPoints[0];
      const p2 = this._adjustedPoints[1];
      const controlAdjusted = this.computeAdjustedControlPoint();

      const samples = 20;
      for (let i = 1; i < samples; i++) {
        const t = i / samples;
        const oneMinusT = 1 - t;

        const bx = oneMinusT * oneMinusT * p0[0] + 2 * oneMinusT * t * controlAdjusted[0] + t * t * p2[0];
        const by = oneMinusT * oneMinusT * p0[1] + 2 * oneMinusT * t * controlAdjusted[1] + t * t * p2[1];

        if (KritzelGeometryHelper.isPointInPolygon({ x: bx, y: by }, polyPoints)) {
          return true;
        }

        // Also check if curve point is within stroke distance of polygon edges
        for (let j = 0; j < polyPoints.length; j++) {
          const q1 = polyPoints[j];
          const q2 = polyPoints[(j + 1) % polyPoints.length];
          const d = this.pointToLineSegmentDistance(bx, by, q1.x, q1.y, q2.x, q2.y);
          if (d <= halfStroke) {
            return true;
          }
        }
      }

      return false;
    }

    // For straight lines, check if line intersects any polygon edge
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

    const oldWidth = this.width;
    const oldHeight = this.height;

    // Recalculate the bounding box (viewBox dimensions)
    const { minX, minY, maxX, maxY } = this.calculateBoundingBox();

    // Calculate the change in origin (in local coordinates)
    const deltaX = minX - this.x;
    const deltaY = minY - this.y;

    const newWidth = maxX - minX;
    const newHeight = maxY - minY;

    const deltaWidth = newWidth - oldWidth;
    const deltaHeight = newHeight - oldHeight;

    const deltaCx = deltaWidth / 2;
    const deltaCy = deltaHeight / 2;

    // Update viewBox dimensions
    this.x = minX;
    this.y = minY;
    this.width = newWidth;
    this.height = newHeight;

    // Rotate the delta to world coordinates before applying to translate
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);

    // We need to compensate for:
    // 1. The shift of the top-left corner (deltaX, deltaY)
    // 2. The shift of the center point (deltaCx, deltaCy) which affects rotation pivot
    // Formula: DeltaT = R(DeltaPos + DeltaCenter) - DeltaCenter

    const vx = deltaX + deltaCx;
    const vy = deltaY + deltaCy;

    const rotatedVx = vx * cos - vy * sin;
    const rotatedVy = vx * sin + vy * cos;

    const correctionX = rotatedVx - deltaCx;
    const correctionY = rotatedVy - deltaCy;

    // Adjust translateX/Y to compensate for the origin shift
    // so the line stays visually in the same position
    this.translateX += correctionX / this.scale;
    this.translateY += correctionY / this.scale;

    // Clear cached adjusted points
    this._adjustedPoints = null;

    this._core.store.state.objects.update(this);
  }

  updateControlPoint(newX: number | undefined, newY: number | undefined): void {
    this.controlX = newX;
    this.controlY = newY;

    const oldWidth = this.width;
    const oldHeight = this.height;

    // Recalculate the bounding box (viewBox dimensions)
    const { minX, minY, maxX, maxY } = this.calculateBoundingBox();

    // Calculate the change in origin (in local coordinates)
    const deltaX = minX - this.x;
    const deltaY = minY - this.y;

    const newWidth = maxX - minX;
    const newHeight = maxY - minY;

    const deltaWidth = newWidth - oldWidth;
    const deltaHeight = newHeight - oldHeight;

    const deltaCx = deltaWidth / 2;
    const deltaCy = deltaHeight / 2;

    // Update viewBox dimensions
    this.x = minX;
    this.y = minY;
    this.width = newWidth;
    this.height = newHeight;

    // Rotate the delta to world coordinates before applying to translate
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);

    // We need to compensate for:
    // 1. The shift of the top-left corner (deltaX, deltaY)
    // 2. The shift of the center point (deltaCx, deltaCy) which affects rotation pivot
    // Formula: DeltaT = R(DeltaPos + DeltaCenter) - DeltaCenter

    const vx = deltaX + deltaCx;
    const vy = deltaY + deltaCy;

    const rotatedVx = vx * cos - vy * sin;
    const rotatedVy = vx * sin + vy * cos;

    const correctionX = rotatedVx - deltaCx;
    const correctionY = rotatedVy - deltaCy;

    // Adjust translateX/Y to compensate for the origin shift
    // so the line stays visually in the same position
    this.translateX += correctionX / this.scale;
    this.translateY += correctionY / this.scale;

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

    return rotatedPoints.map(([px, py]) => [(px - this.x) / this.scale + this.translateX, (py - this.y) / this.scale + this.translateY]);
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

  /**
   * Calculates the minimum distance from a point to a quadratic Bezier curve.
   * Uses sampling along the curve to find the closest point.
   */
  private pointToBezierDistance(x: number, y: number): number {
    if (this._adjustedPoints === null) {
      this._adjustedPoints = this.computeAdjustedPoints();
    }

    const p0 = this._adjustedPoints[0];
    const p2 = this._adjustedPoints[1];

    // Calculate the adjusted control point
    const controlAdjusted = this.computeAdjustedControlPoint();

    let minDistance = Infinity;
    const samples = 20; // Number of samples along the curve

    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const oneMinusT = 1 - t;

      // Quadratic Bezier: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
      const bx = oneMinusT * oneMinusT * p0[0] + 2 * oneMinusT * t * controlAdjusted[0] + t * t * p2[0];
      const by = oneMinusT * oneMinusT * p0[1] + 2 * oneMinusT * t * controlAdjusted[1] + t * t * p2[1];

      const dx = x - bx;
      const dy = y - by;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        minDistance = distance;
      }
    }

    return minDistance;
  }

  /**
   * Computes the adjusted control point in world coordinates, accounting for rotation and translation.
   */
  private computeAdjustedControlPoint(): number[] {
    if (this.controlX === undefined || this.controlY === undefined) {
      // Return midpoint if no control point
      return [(this.startX + this.endX) / 2, (this.startY + this.endY) / 2];
    }

    const angle = this.rotation;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Calculate pivot (center of bounding box for endpoints)
    const xs = [this.startX, this.endX];
    const ys = [this.startY, this.endY];
    const pivot = {
      x: (Math.min(...xs) + Math.max(...xs)) / 2,
      y: (Math.min(...ys) + Math.max(...ys)) / 2,
    };

    const { x: cx, y: cy } = pivot;

    // Rotate control point around pivot
    const dx = this.controlX - cx;
    const dy = this.controlY - cy;
    const rotatedX = cx + dx * cos - dy * sin;
    const rotatedY = cy + dx * sin + dy * cos;

    // Transform to world coordinates
    return [(rotatedX - this.x) / this.scale + this.translateX, (rotatedY - this.y) / this.scale + this.translateY];
  }

  override get rotatedPolygon(): KritzelPolygon {
    const padding = this.padding;

    // Use the bounding box which accounts for curve extrema
    const { minX, minY, maxX, maxY } = KritzelLine.calculateBoundingBox(
      this.startX,
      this.startY,
      this.endX,
      this.endY,
      this.controlX,
      this.controlY,
      this.strokeWidth,
    );

    // Convert to local coordinates (relative to this.x, this.y)
    const localMinX = minX - this.x + padding;
    const localMinY = minY - this.y + padding;
    const localMaxX = maxX - this.x + padding;
    const localMaxY = maxY - this.y + padding;

    const c1 = { x: localMinX, y: localMinY }; // top-left
    const c2 = { x: localMaxX, y: localMinY }; // top-right
    const c3 = { x: localMaxX, y: localMaxY }; // bottom-right
    const c4 = { x: localMinX, y: localMaxY }; // bottom-left

    const cx = this.totalWidth / 2;
    const cy = this.totalHeight / 2;
    const angle = this.rotation;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const transform = (p: { x: number; y: number }) => {
      const rx = (p.x - cx) * cos - (p.y - cy) * sin + cx;
      const ry = (p.x - cx) * sin + (p.y - cy) * cos + cy;
      return {
        x: rx / this.scale + this.translateX,
        y: ry / this.scale + this.translateY,
      };
    };

    return {
      topLeft: transform(c1),
      topRight: transform(c2),
      bottomRight: transform(c3),
      bottomLeft: transform(c4),
    };
  }

  /**
   * Calculates the tight bounding box for a quadratic Bezier curve or straight line.
   * For curves, it finds the extrema points where the derivative equals zero.
   */
  static calculateBoundingBox(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    controlX: number | undefined,
    controlY: number | undefined,
    strokeWidth: number,
  ): { minX: number; minY: number; maxX: number; maxY: number } {
    let minX = Math.min(startX, endX);
    let minY = Math.min(startY, endY);
    let maxX = Math.max(startX, endX);
    let maxY = Math.max(startY, endY);

    if (controlX !== undefined && controlY !== undefined) {
      // For a quadratic Bezier: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
      // Derivative: B'(t) = 2(1-t)(P₁-P₀) + 2t(P₂-P₁) = 0
      // Solving for t: t = (P₀ - P₁) / (P₀ - 2P₁ + P₂)

      // Find extrema for X
      const aX = startX - 2 * controlX + endX;
      if (aX !== 0) {
        const tX = (startX - controlX) / aX;
        if (tX > 0 && tX < 1) {
          const extremaX = (1 - tX) * (1 - tX) * startX + 2 * (1 - tX) * tX * controlX + tX * tX * endX;
          minX = Math.min(minX, extremaX);
          maxX = Math.max(maxX, extremaX);
        }
      }

      // Find extrema for Y
      const aY = startY - 2 * controlY + endY;
      if (aY !== 0) {
        const tY = (startY - controlY) / aY;
        if (tY > 0 && tY < 1) {
          const extremaY = (1 - tY) * (1 - tY) * startY + 2 * (1 - tY) * tY * controlY + tY * tY * endY;
          minY = Math.min(minY, extremaY);
          maxY = Math.max(maxY, extremaY);
        }
      }
    }

    const halfStroke = strokeWidth / 2;
    return {
      minX: minX - halfStroke,
      minY: minY - halfStroke,
      maxX: maxX + halfStroke,
      maxY: maxY + halfStroke,
    };
  }

  calculateBoundingBox(): { minX: number; minY: number; maxX: number; maxY: number } {
    return KritzelLine.calculateBoundingBox(
      this.startX,
      this.startY,
      this.endX,
      this.endY,
      this.controlX,
      this.controlY,
      this.strokeWidth,
    );
  }

  private updateDimensions(): void {
    const { minX, minY, maxX, maxY } = this.calculateBoundingBox();

    this.width = maxX - minX;
    this.height = maxY - minY;

    this.x = minX;
    this.y = minY;

    this.translateX = (this.x + this.translateX) / this.scale;
    this.translateY = (this.y + this.translateY) / this.scale;
  }

  /** Get unique marker ID for SVG defs at the start of the line */
  get startMarkerId(): string {
    return `arrow-start-${this.id}`;
  }

  /** Get unique marker ID for SVG defs at the end of the line */
  get endMarkerId(): string {
    return `arrow-end-${this.id}`;
  }

  /** Get the arrow size for start or end, defaulting to strokeWidth * 3 */
  getArrowSize(end: 'start' | 'end'): number {
    const config = end === 'start' ? this.arrows?.start : this.arrows?.end;
    return config?.size ?? this.strokeWidth * 3;
  }

  /** Get the arrow fill color for start or end, defaulting to stroke color */
  getArrowFill(end: 'start' | 'end'): string {
    const config = end === 'start' ? this.arrows?.start : this.arrows?.end;
    return config?.fill ?? this.stroke;
  }

  /**
   * Generate SVG path data for an arrow head based on the given style.
   * The path is designed to fit in a 10x10 viewBox with the tip at (10, 5).
   * @param style The arrow head style
   * @returns SVG path data string
   */
  getArrowPath(style: ArrowHeadStyle = 'triangle'): string {
    switch (style) {
      case 'triangle':
        return 'M 0 0 L 10 5 L 0 10 z';
      case 'open':
        return 'M 0 0 L 10 5 L 0 10';
      case 'diamond':
        return 'M 0 5 L 5 0 L 10 5 L 5 10 z';
      case 'circle':
        return 'M 5,0 A 5,5 0 1,1 5,10 A 5,5 0 1,1 5,0';
      default:
        return 'M 0 0 L 10 5 L 0 10 z';
    }
  }

  /** Check if start arrow is enabled */
  get hasStartArrow(): boolean {
    return this.arrows?.start?.enabled === true;
  }

  /** Check if end arrow is enabled */
  get hasEndArrow(): boolean {
    return this.arrows?.end?.enabled === true;
  }
}
