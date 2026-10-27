import { KritzelBaseObject } from './base-object.class';
import { KritzelPolygon } from '../../interfaces/polygon.interface';
import { KritzelGeometryHelper } from '../../helpers/geometry.helper';
import { KritzelPoint } from '../../interfaces/point.interface';
import { KritzelCore } from '../core/core.class';
import { LineAnchor } from '../../interfaces/anchor.interface';
import { ArrowHeadStyle, LineArrowConfig } from '../../interfaces/arrow-head.interface';
import { ThemeAwareColor } from '../../constants/color-palette.constants';
import { KritzelColorHelper } from '../../helpers/color.helper';
import { KritzelMathHelper } from '../../helpers/math.helper';

/**
 * Configuration options for creating a KritzelLine instance.
 */
export interface KritzelLineConfig {
  /** User-facing name, shown as the title of the object's titlebar. */
  name?: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  controlX?: number;
  controlY?: number;
  translateX?: number;
  translateY?: number;
  /** Rotation in degrees at initialization time. */
  rotation?: number;
  scale?: number;
  stroke?: ThemeAwareColor;
  strokeWidth?: number;
  opacity?: number;
  /** Anchor connection for the start point */
  startAnchor?: LineAnchor;
  /** Anchor connection for the end point */
  endAnchor?: LineAnchor;
  /** Arrow head configuration for start and end of line */
  arrows?: LineArrowConfig;
}

export class KritzelLine extends KritzelBaseObject<SVGElement> {
  override __class__: string = 'KritzelLine';

  startX: number;
  startY: number;
  endX: number;
  endY: number;
  controlX?: number;
  controlY?: number;
  stroke: ThemeAwareColor;
  strokeWidth: number;
  scale: number = 1;
  options: KritzelLineConfig | undefined;

  /** Anchor connection for the start point of the line */
  startAnchor?: LineAnchor;
  /** Anchor connection for the end point of the line */
  endAnchor?: LineAnchor;
  /** Arrow head configuration for start and end of line */
  arrows?: LineArrowConfig;

  isVisible: boolean = true;
  isDebugInfoVisible: boolean = true;
  isCompleted: boolean = false;

  /** Cached adjusted points for hit testing, accounting for rotation and translation */
  private _adjustedPoints?: number[][] = null;
  /** Cached clip information for anchored line endpoints */
  private _clipInfo: { start?: { x: number; y: number; t?: number }; end?: { x: number; y: number; t?: number } } | null = null;

  /**
   * Generates the SVG path data string for the line.
   * Returns a quadratic Bezier curve path if control point exists, otherwise a straight line.
   * @returns SVG path data string in the format "M x y Q cx cy ex ey" or "M x y L ex ey"
   */
  get d(): string {
    if (this.controlX !== undefined && this.controlY !== undefined) {
      return `M ${this.startX} ${this.startY} Q ${this.controlX} ${this.controlY} ${this.endX} ${this.endY}`;
    }
    return `M ${this.startX} ${this.startY} L ${this.endX} ${this.endY}`;
  }

  /**
   * Generates the SVG viewBox attribute string for rendering the line.
   * @returns ViewBox string in the format "x y width height"
   */
  get viewBox(): string {
    return `${this.x} ${this.y} ${this.width} ${this.height}`;
  }

  /**
   * Creates a new KritzelLine instance.
   * @param config - Optional configuration options for the line including start/end points,
   *                 control point for curves, stroke settings, anchors, and arrow configuration
   */
  constructor(config?: KritzelLineConfig) {
    super();
    this.name = config?.name;
    this.options = config;
    this.startX = config?.startX ?? 0;
    this.startY = config?.startY ?? 0;
    this.endX = config?.endX ?? 0;
    this.endY = config?.endY ?? 0;
    this.controlX = config?.controlX;
    this.controlY = config?.controlY;
    this.translateX = config?.translateX ?? 0;
    this.translateY = config?.translateY ?? 0;
    this.rotation = KritzelMathHelper.degreesToRadians(config?.rotation ?? 0);
    this.scale = config?.scale ?? 1;
    this.strokeWidth = config?.strokeWidth ?? 4;
    this.stroke = config?.stroke ?? { light: '#000000', dark: '#ffffff' };
    this.startAnchor = config?.startAnchor;
    this.endAnchor = config?.endAnchor;
    this.arrows = config?.arrows;
    this.updateDimensions();
  }

  /**
   * Factory method to create a new KritzelLine with a core reference and unique ID.
   * This is the preferred way to create lines that will be managed by the core.
   * @param core - The KritzelCore instance that will manage this line
   * @param options - Optional configuration options for the line
   * @returns A fully initialized KritzelLine instance with generated ID and workspace assignment
   */
  static override create(core: KritzelCore, options?: KritzelLineConfig): KritzelLine {
    const object = new KritzelLine();

    object._core = core;
    object.id = object.generateId();
    object.workspaceId = core.store.state.activeWorkspace!.id;
    object.userId = core.user?.id;
    object.options = options;
    object.startX = options?.startX ?? 0;
    object.startY = options?.startY ?? 0;
    object.endX = options?.endX ?? 0;
    object.endY = options?.endY ?? 0;
    object.controlX = options?.controlX;
    object.controlY = options?.controlY;
    object.translateX = options?.translateX ?? 0;
    object.translateY = options?.translateY ?? 0;
    object.rotation = KritzelMathHelper.degreesToRadians(options?.rotation ?? 0);
    object.scale = options?.scale ?? 1;
    object.strokeWidth = options?.strokeWidth ?? 4;
    object.stroke = options?.stroke ?? { light: '#000000', dark: '#ffffff' };
    object.opacity = options?.opacity ?? 1;
    object.startAnchor = options?.startAnchor;
    object.endAnchor = options?.endAnchor;
    object.arrows = options?.arrows;
    object.zIndex = core.store.currentZIndex;
    object.updateDimensions();

    return object;
  }

  /**
   * Resizes the line to fit within the specified dimensions.
   * Scales both endpoints and control point proportionally, then repositions the line.
   * @param x - New X position for the line (or null to keep current)
   * @param y - New Y position for the line (or null to keep current)
   * @param width - New width to scale the line to (must be > 1)
   * @param height - New height to scale the line to (must be > 1)
   */
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
    this._clipInfo = null;

    this._core.store.objects.update(this);

    // Update anchors after the line is updated
    this._core.anchorManager.updateAnchorsForObject(this.id);

    if (this.startAnchor) {
      this._core.anchorManager.updateAnchorsForObject(this.startAnchor.objectId);
    }
    if (this.endAnchor) {
      this._core.anchorManager.updateAnchorsForObject(this.endAnchor.objectId);
    }
  }

  /**
   * Sets the rotation angle of the line around its center.
   * Invalidates cached adjusted points and clip info.
   * @param value - Rotation angle in radians
   */
  override rotate(value: number): void {
    this.rotation = value;
    this._adjustedPoints = null;
    this._clipInfo = null;

    this._core.store.objects.update(this);
  }

  /**
   * Moves the line by calculating the delta between start and end positions.
   * Updates anchored objects if the line has anchor connections.
   * @param startX - Starting X position of the drag in screen coordinates
   * @param startY - Starting Y position of the drag in screen coordinates
   * @param endX - Ending X position of the drag in screen coordinates
   * @param endY - Ending Y position of the drag in screen coordinates
   */
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
    this._clipInfo = null;

    this._core.store.objects.update(this);
  }

  /**
   * Tests if a point intersects with the line within the stroke tolerance.
   * Uses distance to line segment for straight lines, or distance to Bezier curve for curved lines.
   * @param x - X coordinate of the point to test in world coordinates
   * @param y - Y coordinate of the point to test in world coordinates
   * @returns True if the point is within the stroke width tolerance of the line
   */
  override hitTest(x: number, y: number): boolean {
    const minHitThreshold = 20;
    const strokeWidth = Math.max(this.strokeWidth, minHitThreshold);
    const halfStroke = strokeWidth / this.scale / 2;

    if (this._adjustedPoints === null) {
      this._adjustedPoints = this.computeAdjustedPoints();
    }

    // For curved lines, use distance to the Bezier curve
    if (this.controlX !== undefined && this.controlY !== undefined) {
      const clip = this.getClipInfo();
      const startT = clip.start?.t ?? 0;
      const endT = clip.end?.t ?? 1;
      const distance = this.pointToBezierDistance(x, y, startT, endT);
      return distance <= halfStroke;
    }

    // For straight lines, use distance to line segment
    const clip = this.getClipInfo();
    const p1 = clip.start ? [clip.start.x, clip.start.y] : this._adjustedPoints[0];
    const p2 = clip.end ? [clip.end.x, clip.end.y] : this._adjustedPoints[1];

    const distance = this.pointToLineSegmentDistance(x, y, p1[0], p1[1], p2[0], p2[1]);
    return distance <= halfStroke;
  }

  /**
   * Tests if the line intersects with or is contained within a polygon.
   * Checks endpoint containment, polygon vertex proximity, curve sampling for Bezier curves,
   * and line-edge intersections for straight lines.
   * @param polygon - The polygon to test intersection with, defined by four corner points
   * @returns True if any part of the line intersects with the polygon
   */
  override hitTestPolygon(polygon: KritzelPolygon): boolean {
    const halfStroke = this.strokeWidth / this.scale / 2;

    if (this._adjustedPoints === null) {
      this._adjustedPoints = this.computeAdjustedPoints();
    }

    const clip = this.getClipInfo();

    const polyPoints: KritzelPoint[] = [
      { x: polygon.bottomLeft.x, y: polygon.bottomLeft.y },
      { x: polygon.bottomRight.x, y: polygon.bottomRight.y },
      { x: polygon.topRight.x, y: polygon.topRight.y },
      { x: polygon.topLeft.x, y: polygon.topLeft.y },
    ];

    // Check if any endpoint is inside the polygon
    // Use clipped endpoints
    const p1 = clip.start ? [clip.start.x, clip.start.y] : this._adjustedPoints[0];
    const p2 = clip.end ? [clip.end.x, clip.end.y] : this._adjustedPoints[1];

    const endpoints = [p1, p2];

    for (const [px, py] of endpoints) {
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

      const startT = clip.start?.t ?? 0;
      const endT = clip.end?.t ?? 1;

      const samples = 20;
      for (let i = 0; i <= samples; i++) {
        const fraction = i / samples;
        const t = startT + fraction * (endT - startT);
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
    const checkP1 = { x: p1[0], y: p1[1] };
    const checkP2 = { x: p2[0], y: p2[1] };

    for (let j = 0; j < polyPoints.length; j++) {
      const q1 = polyPoints[j];
      const q2 = polyPoints[(j + 1) % polyPoints.length];

      if (KritzelGeometryHelper.intersectLines(checkP1, checkP2, q1, q2)) {
        return true;
      }

      // Check distance from polygon edges to line segment
      const d1 = this.pointToLineSegmentDistance(q1.x, q1.y, checkP1.x, checkP1.y, checkP2.x, checkP2.y);
      const d2 = this.pointToLineSegmentDistance(q2.x, q2.y, checkP1.x, checkP1.y, checkP2.x, checkP2.y);
      const d3 = this.pointToLineSegmentDistance(checkP1.x, checkP1.y, q1.x, q1.y, q2.x, q2.y);
      const d4 = this.pointToLineSegmentDistance(checkP2.x, checkP2.y, q1.x, q1.y, q2.x, q2.y);

      const minD = Math.min(d1, d2, d3, d4);
      if (minD <= halfStroke) {
        return true;
      }
    }

    return false;
  }

  /**
   * Updates the translation position of the line without recalculating dimensions.
   * Invalidates cached adjusted points and clip info.
   * @param x - New X translation in world coordinates
   * @param y - New Y translation in world coordinates
   */
  override updatePosition(x: number, y: number): void {
    this.translateX = x;
    this.translateY = y;
    this._adjustedPoints = null;
    this._clipInfo = null;
    this._core.store.objects.update(this);
  }

  /**
   * Updates a specific endpoint of the line (start or end).
   * Recalculates the bounding box dimensions and adjusts translation to maintain
   * the visual position after the origin shift, accounting for rotation.
   * @param handleType - Which endpoint to update: 'start' or 'end'
   * @param newX - New X coordinate in viewBox-local space (relative to x, y origin)
   * @param newY - New Y coordinate in viewBox-local space (relative to x, y origin)
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
    this._clipInfo = null;

    this._core.store.objects.update(this);
  }

  /**
   * Updates the control point for a quadratic Bezier curve.
   * Recalculates bounding box and adjusts translation to maintain visual position.
   * Pass undefined for both parameters to convert the line back to a straight line.
   * @param newX - New X coordinate for the control point, or undefined to remove
   * @param newY - New Y coordinate for the control point, or undefined to remove
   */
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
    this._clipInfo = null;

    this._core.store.objects.update(this);
  }

  /**
   * Computes the line endpoints in world coordinates, accounting for rotation,
   * scale, and translation transformations.
   * @returns Array of two points [[startX, startY], [endX, endY]] in world coordinates
   */
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

  /**
   * Calculates the minimum distance from a point to a line segment.
   * Uses parametric projection to find the closest point on the segment.
   * @param x - X coordinate of the test point
   * @param y - Y coordinate of the test point
   * @param x1 - X coordinate of the segment start
   * @param y1 - Y coordinate of the segment start
   * @param x2 - X coordinate of the segment end
   * @param y2 - Y coordinate of the segment end
   * @returns The minimum distance from the point to the line segment
   */
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
   * Uses sampling along the curve (20 samples) to approximate the closest point.
   * @param x - X coordinate of the test point in world coordinates
   * @param y - Y coordinate of the test point in world coordinates
   * @param startT - Start parameter for curve sampling (0-1), used for clipped curves
   * @param endT - End parameter for curve sampling (0-1), used for clipped curves
   * @returns The minimum distance from the point to the sampled curve
   */
  private pointToBezierDistance(x: number, y: number, startT: number = 0, endT: number = 1): number {
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
      const fraction = i / samples;
      const t = startT + fraction * (endT - startT);
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
   * Retrieves or computes the clip information for anchored line endpoints.
   * Caches the result to avoid recalculation on subsequent calls.
   * @returns Object containing optional start and end clip points with world coordinates
   *          and parametric t values for curve clipping
   */
  private getClipInfo() {
    if (this._clipInfo) return this._clipInfo;

    const startAnchor = this.startAnchor;
    const endAnchor = this.endAnchor;

    const result: { start?: { x: number; y: number; t?: number }; end?: { x: number; y: number; t?: number } } = {};

    if (startAnchor) {
      const target = this._core.anchorManager.findAnchorTarget(this, 'start');
      if (target) {
        const clip = this._core.anchorManager.computeAnchorClipInfo(this, 'start', target);
        if (clip) {
          result.start = { x: clip.worldX, y: clip.worldY, t: clip.t };
        }
      }
    }

    if (endAnchor) {
      const target = this._core.anchorManager.findAnchorTarget(this, 'end');
      if (target) {
        const clip = this._core.anchorManager.computeAnchorClipInfo(this, 'end', target);
        if (clip) {
          result.end = { x: clip.worldX, y: clip.worldY, t: clip.t };
        }
      }
    }

    this._clipInfo = result;
    return result;
  }

  /**
   * Computes the adjusted control point in world coordinates.
   * Applies rotation around the bounding box center, then scale and translation transforms.
   * @returns Array [x, y] representing the control point in world coordinates,
   *          or the midpoint of the line if no control point is defined
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

  /**
   * Gets the bounding polygon of the line in world coordinates, accounting for rotation.
   * Used for selection bounds and intersection testing.
   * @returns A polygon with four corner points (topLeft, topRight, bottomRight, bottomLeft)
   *          transformed to world coordinates with rotation applied
   */
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
   * For curves, finds extrema points where the derivative equals zero to ensure
   * the bounding box encompasses the entire curve arc.
   * @param startX - X coordinate of the line start point
   * @param startY - Y coordinate of the line start point
   * @param endX - X coordinate of the line end point
   * @param endY - Y coordinate of the line end point
   * @param controlX - X coordinate of the control point (undefined for straight lines)
   * @param controlY - Y coordinate of the control point (undefined for straight lines)
   * @param strokeWidth - Width of the line stroke for padding calculation
   * @returns Object with minX, minY, maxX, maxY including stroke width padding
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

  /**
   * Calculates the bounding box for this line instance using the current endpoint,
   * control point, and stroke width values.
   * @returns Object with minX, minY, maxX, maxY bounds including stroke width padding
   */
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

  /**
   * Serializes the line while excluding transient cache fields.
   * @returns A serializable line object without runtime caches
   */
  override serialize() {
    const serialized = super.serialize();
    delete serialized._adjustedPoints;
    delete serialized._clipInfo;
    return serialized;
  }

  /**
   * Deserializes and resets transient caches so geometry is recomputed lazily.
   * @param object - The serialized line object
   * @returns This instance cast to type T
   */
  override deserialize<T>(object: any): T {
    const result = super.deserialize<T>(object);
    this._adjustedPoints = null;
    this._clipInfo = null;
    return result;
  }

  /**
   * Recalculates and updates the width, height, x, y, and translation properties
   * based on the current endpoint positions and stroke width.
   * Called during construction and after endpoint changes.
   */
  private updateDimensions(): void {
    const { minX, minY, maxX, maxY } = this.calculateBoundingBox();

    this.width = maxX - minX;
    this.height = maxY - minY;

    this.x = minX;
    this.y = minY;

    this.translateX = (this.x + this.translateX) / this.scale;
    this.translateY = (this.y + this.translateY) / this.scale;
  }

  /**
   * Gets the unique SVG marker ID for the arrow head at the start of the line.
   * Used in SVG defs for marker-start attribute.
   * @returns A unique marker ID string in the format "arrow-start-{lineId}"
   */
  get startMarkerId(): string {
    return `arrow-start-${this.id}`;
  }

  /**
   * Gets the unique SVG marker ID for the arrow head at the end of the line.
   * Used in SVG defs for marker-end attribute.
   * @returns A unique marker ID string in the format "arrow-end-{lineId}"
   */
  get endMarkerId(): string {
    return `arrow-end-${this.id}`;
  }

  /**
   * Gets the arrow head size for the specified end of the line.
   * @param end - Which end to get the arrow size for: 'start' or 'end'
   * @returns The configured arrow size, or strokeWidth * 3 as default
   */
  getArrowSize(end: 'start' | 'end'): number {
    const config = end === 'start' ? this.arrows?.start : this.arrows?.end;
    return config?.size ?? this.strokeWidth * 3;
  }

  /**
   * Gets the resolved fill color for the arrow head at the specified end.
   * Resolves theme-aware colors to the appropriate value for the current theme.
   * @param end - Which end to get the arrow fill for: 'start' or 'end'
   * @returns The resolved CSS color string for the arrow fill
   */
  getArrowFill(end: 'start' | 'end'): string {
    const config = end === 'start' ? this.arrows?.start : this.arrows?.end;
    const color = config?.fill ?? this.stroke;
    return KritzelColorHelper.resolveThemeColor(color, this._core?.themeManager?.currentTheme);
  }

  /**
   * Generates SVG path data for an arrow head based on the given style.
   * All paths are designed to fit in a 10x10 viewBox with the tip at (10, 5).
   * @param style - The arrow head style: 'triangle' (filled), 'open' (outline),
   *                'diamond' (rhombus), or 'circle'. Defaults to 'triangle'.
   * @returns SVG path data string for use in a marker element
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

  /**
   * Checks if an arrow head is enabled at the start of the line.
   * @returns True if the start arrow configuration exists and is enabled
   */
  get hasStartArrow(): boolean {
    return this.arrows?.start?.enabled === true;
  }

  /**
   * Checks if an arrow head is enabled at the end of the line.
   * @returns True if the end arrow configuration exists and is enabled
   */
  get hasEndArrow(): boolean {
    return this.arrows?.end?.enabled === true;
  }
}
