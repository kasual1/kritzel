import { getStroke } from 'perfect-freehand';
import { ObjectHelper } from '../../helpers/object.helper';
import { KritzelObjectCommonConfig } from '../../interfaces/object.interface';
import { KritzelMathHelper } from '../../helpers/math.helper';
import { KritzelBaseObject } from './base-object.class';
import { KritzelPolygon } from '../../interfaces/polygon.interface';
import { KritzelGeometryHelper } from '../../helpers/geometry.helper';
import { KritzelPoint } from '../../interfaces/point.interface';
import { KritzelCore } from '../core/core.class';
import { ThemeAwareColor } from '../../constants/color-palette.constants';
import { KritzelObjectExportContext, KritzelObjectExportFormat } from '../../interfaces/object-export.interface';

/**
 * Configuration options for creating a KritzelPath instance.
 */
export interface KritzelPathConfig extends KritzelObjectCommonConfig {
  points?: number[][];
  translateX?: number;
  translateY?: number;
  /** Rotation in degrees at initialization time. */
  rotation?: number;
  scale?: number;
  stroke?: ThemeAwareColor;
  strokeWidth?: number;
  fill?: ThemeAwareColor;
  opacity?: number;
  lineSlack?: number;
}

export class KritzelPath extends KritzelBaseObject<SVGElement> {
  override __class__: string = 'KritzelPath';

  points: number[][];
  d: string;
  stroke: ThemeAwareColor = { light: 'none', dark: 'none' };
  strokeWidth: number;
  lineSlack: number = 0.5;
  fill: ThemeAwareColor;
  x: number = 0;
  y: number = 0;
  height: number = 0;
  width: number = 0;
  scale: number = 1;
  options: KritzelPathConfig | undefined;

  isVisible: boolean = true;
  isDebugInfoVisible: boolean = true;
  isCompleted: boolean = false;

  private _adjustedPoints: number[][] | null = null;

  /**
   * Gets the SVG viewBox string for local (object-relative) rendering.
   *
   * The path's `d` string is generated in local coordinates (offset so the
   * object's top-left origin is at 0,0), so the viewBox always starts at 0,0.
   * Keeping the SVG's internal coordinates small — independent of the object's
   * world position — avoids float32 precision loss in the browser's SVG
   * rasterizer (Skia), which otherwise fails to paint paths whose absolute
   * world coordinates exceed ~2^24 (e.g. far from the origin at extreme zoom).
   * @returns The viewBox attribute value in the format "0 0 width height"
   */
  get viewBox(): string {
    return `0 0 ${this.width} ${this.height}`;
  }

  /**
   * Creates a new KritzelPath instance.
   * @param config - Optional configuration object for the path
   * @param config.points - Array of [x, y] coordinate pairs defining the path
   * @param config.translateX - Horizontal translation offset (default: 0)
   * @param config.translateY - Vertical translation offset (default: 0)
   * @param config.scale - Scale factor for the path (default: 1)
   * @param config.strokeWidth - Width of the stroke in pixels (default: 8)
   * @param config.fill - Theme-aware fill color with light and dark variants
   * @param config.lineSlack - Additional padding for bounding box calculations (default: 0.5)
   */
  constructor(config?: KritzelPathConfig) {
    super();
    ObjectHelper.applyCommonConfig(this, config);
    this.options = config;
    this.points = config?.points ?? [];
    this.translateX = config?.translateX ?? 0;
    this.translateY = config?.translateY ?? 0;
    this.rotation = KritzelMathHelper.degreesToRadians(config?.rotation ?? 0);
    this.scale = config?.scale ?? 1;
    this.strokeWidth = config?.strokeWidth ?? 8;
    this.fill = config?.fill ?? { light: '#000000', dark: '#ffffff' };
    this.d = this.generateSvgPath();
    this.updateDimensions();
  }

  /**
   * Factory method to create a new KritzelPath instance with a core reference.
   * This is the preferred way to create paths that will be managed by the canvas.
   * @param core - The KritzelCore instance that will manage this path
   * @param options - Optional configuration options for the path
   * @returns A new KritzelPath instance configured with the provided options
   */
  static override create(core: KritzelCore, options?: KritzelPathConfig): KritzelPath {
    const object = new KritzelPath();

    object._core = core;
    object.id = object.generateId();
    object.workspaceId = core.store.state.activeWorkspace!.id;
    object.userId = core.user?.id;
    object.options = options;
    object.points = options?.points ?? [];
    object.translateX = options?.translateX ?? 0;
    object.translateY = options?.translateY ?? 0;
    object.rotation = KritzelMathHelper.degreesToRadians(options?.rotation ?? 0);
    object.scale = options?.scale ?? 1;
    object.strokeWidth = options?.strokeWidth ?? 8;
    object.fill = options?.fill ?? { light: '#000000', dark: '#ffffff' };
    object.opacity = options?.opacity ?? 1;
    object.zIndex = core.store.currentZIndex;
    object.d = object.generateSvgPath();
    object.updateDimensions();

    return object;
  }

  /**
   * Creates a deep copy of this path object.
   * The points array is cloned to ensure the copy is independent.
   * @returns A new KritzelPath instance with copied properties
   */
  override copy(): KritzelPath {
    const copiedObject = super.copy() as KritzelPath;
    if (this.points) {
      copiedObject.points = this.points.map(p => [...p]);
    }
    return copiedObject;
  }

  /**
   * Restores the path from a serialized object, then regenerates the SVG `d`
   * string from the restored points.
   *
   * Regeneration is required because the `d` string is now emitted in local
   * (object-relative) coordinates paired with a "0 0 width height" viewBox.
   * Older persisted paths stored `d` in absolute world coordinates, which
   * would be inconsistent with the local-coordinate viewBox and fail to
   * rasterize far from the origin at extreme zoom. Recomputing `d` here makes
   * both freshly created and previously persisted paths render identically.
   * @param object - The serialized path data to restore from
   * @returns This instance cast to type T
   */
  override deserialize<T>(object: any): T {
    const result = super.deserialize<T>(object);
    this.d = this.generateSvgPath();
    return result;
  }

  /**
   * Resizes the path to fit within the specified dimensions.
   * Scales all points proportionally and updates the SVG path.
   * @param x - New X position for the path, or null to keep current
   * @param y - New Y position for the path, or null to keep current
   * @param width - New width for the path (must be > 1)
   * @param height - New height for the path (must be > 1)
   */
  override resize(x: number | null, y: number | null, width: number, height: number): void {
    if (width <= 1 || height <= 1) {
      return;
    }

    const scaleX = width / this.width;
    const scaleY = height / this.height;

    this.width = width;
    this.height = height;

    if (this.points.length === 1) {
      const p = this.points[0];
      const spreadX = Math.max(0, width - this.strokeWidth) / scaleX;
      const spreadY = Math.max(0, height - this.strokeWidth) / scaleY;
      this.points.push([p[0] + spreadX, p[1] + spreadY]);
    }

    this.points = this.points.map(([x, y]) => [x * scaleX, y * scaleY]);

    this.d = this.generateSvgPath();

    this.width = Math.max(...this.points.map(p => p[0])) - Math.min(...this.points.map(p => p[0])) + this.strokeWidth;
    this.height = Math.max(...this.points.map(p => p[1])) - Math.min(...this.points.map(p => p[1])) + this.strokeWidth;

    this.x = Math.min(...this.points.map(p => p[0])) - this.strokeWidth / 2;
    this.y = Math.min(...this.points.map(p => p[1])) - this.strokeWidth / 2;

    if (x !== null) {
      this.translateX = x;
    }
    if (y !== null) {
      this.translateY = y;
    }

    this._adjustedPoints = null;

    this._core.store.objects.update(this);
  }

  /**
   * Rotates the path by the specified angle.
   * Invalidates cached adjusted points to force recalculation.
   * @param value - Rotation angle in radians
   */
  override rotate(value: number): void {
    this.rotation = value;
    this._adjustedPoints = null;

    this._core.store.objects.update(this);
  }

  /**
   * Moves the path by calculating the delta between start and end positions.
   * The delta is adjusted for the current viewport scale.
   * @param startX - Starting X coordinate in screen space
   * @param startY - Starting Y coordinate in screen space
   * @param endX - Ending X coordinate in screen space
   * @param endY - Ending Y coordinate in screen space
   */
  override move(startX: number, startY: number, endX: number, endY: number): void {
    const deltaX = (startX - endX) / this._core.store.state.scale;
    const deltaY = (startY - endY) / this._core.store.state.scale;

    this.translateX += deltaX;
    this.translateY += deltaY;

    this._adjustedPoints = null;

    this._core.store.objects.update(this);
  }

  /**
   * Tests whether a point intersects with the path's stroke.
   * Uses distance-to-line-segment calculations for accurate hit detection.
   * @param x - X coordinate to test in world space
   * @param y - Y coordinate to test in world space
   * @returns True if the point is within the stroke width of the path
   */
  override hitTest(x: number, y: number): boolean {
    const halfStroke = this.strokeWidth / this.scale / 2;

    if (this._adjustedPoints === null) {
      this._adjustedPoints = this.computeAdjustedPoints();
    }

    if (this._adjustedPoints.length === 1) {
      const p1 = this._adjustedPoints[0];
      const distance = this.pointToLineSegmentDistance(x, y, p1[0], p1[1], p1[0], p1[1]);
      return distance <= halfStroke;
    }

    for (let i = 0; i < this._adjustedPoints.length - 1; i++) {
      const p1 = this._adjustedPoints[i];
      const p2 = this._adjustedPoints[i + 1];

      const distance = this.pointToLineSegmentDistance(x, y, p1[0], p1[1], p2[0], p2[1]);

      if (distance <= halfStroke) {
        return true;
      }
    }

    return false;
  }

  /**
   * Tests whether a polygon intersects with the path.
   * Checks for point containment, edge intersections, and proximity to stroke.
   * @param polygon - The polygon to test against, defined by its corner points
   * @returns True if any part of the polygon overlaps with the path's stroke
   */
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

    for (const [px, py] of this._adjustedPoints) {
      if (KritzelGeometryHelper.isPointInPolygon({ x: px, y: py }, polyPoints)) {
        return true;
      }
    }

    for (const pt of polyPoints) {
      if (this.hitTest(pt.x, pt.y)) {
        return true;
      }
    }

    for (let i = 0; i < this._adjustedPoints.length - 1; i++) {
      const p1 = { x: this._adjustedPoints[i][0], y: this._adjustedPoints[i][1] };
      const p2 = { x: this._adjustedPoints[i + 1][0], y: this._adjustedPoints[i + 1][1] };

      for (let j = 0; j < polyPoints.length; j++) {
        const q1 = polyPoints[j];
        const q2 = polyPoints[(j + 1) % polyPoints.length];

        if (KritzelGeometryHelper.intersectLines(p1, p2, q1, q2)) {
          return true;
        }
      }
    }

    for (let i = 0; i < this._adjustedPoints.length - 1; i++) {
      const p1 = this._adjustedPoints[i];
      const p2 = this._adjustedPoints[i + 1];

      for (let j = 0; j < polyPoints.length; j++) {
        const q1 = polyPoints[j];
        const q2 = polyPoints[(j + 1) % polyPoints.length];

        const d1 = this.pointToLineSegmentDistance(q1.x, q1.y, p1[0], p1[1], p2[0], p2[1]);
        const d2 = this.pointToLineSegmentDistance(q2.x, q2.y, p1[0], p1[1], p2[0], p2[1]);
        const d3 = this.pointToLineSegmentDistance(p1[0], p1[1], q1.x, q1.y, q2.x, q2.y);
        const d4 = this.pointToLineSegmentDistance(p2[0], p2[1], q1.x, q1.y, q2.x, q2.y);

        const minD = Math.min(d1, d2, d3, d4);
        if (minD <= halfStroke) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Updates the path's position to the specified coordinates.
   * Invalidates cached adjusted points and triggers a store update.
   * @param x - New X position in world space
   * @param y - New Y position in world space
   */
  override updatePosition(x: number, y: number): void {
    this.translateX = x;
    this.translateY = y;
    this._adjustedPoints = null;
    this._core.store.objects.update(this);
  }

  /**
   * Lifecycle hook called after properties have been updated.
   * Regenerates the SVG path and bounding box when strokeWidth changes.
   * @param changedProperties - Array of property names that were modified
   */
  override onAfterUpdate(changedProperties: string[]): void {
    if (changedProperties.includes('strokeWidth')) {
      this.d = this.generateSvgPath();
      this.updateBoundingBox();
      this._adjustedPoints = null;
    }
  }

  /**
   * Computes the world-space coordinates of all path points.
   * Applies rotation around the path's center and adjusts for translation and scale.
   * Results are cached in _adjustedPoints for performance.
   * @returns Array of [x, y] coordinate pairs in world space
   */
  private computeAdjustedPoints(): number[][] {
    if (!this.points?.length) {
      return [];
    }

    const angle = this.rotation;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const xs = this.points.map(p => p[0]);
    const ys = this.points.map(p => p[1]);
    const pivot = {
      x: (Math.min(...xs) + Math.max(...xs)) / 2,
      y: (Math.min(...ys) + Math.max(...ys)) / 2,
    };

    const { x: cx, y: cy } = pivot;

    const rotatedPoints = this.points.map(([x, y]) => {
      const dx = x - cx;
      const dy = y - cy;
      return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
    });

    return rotatedPoints.map(([px, py]) => [Math.abs(px - this.x) / this.scale + this.translateX, Math.abs(py - this.y) / this.scale + this.translateY]);
  }

  /**
   * Calculates the shortest distance from a point to a line segment.
   * Uses projection to find the closest point on the segment.
   * @param x - X coordinate of the test point
   * @param y - Y coordinate of the test point
   * @param x1 - X coordinate of the line segment start
   * @param y1 - Y coordinate of the line segment start
   * @param x2 - X coordinate of the line segment end
   * @param y2 - Y coordinate of the line segment end
   * @returns The shortest distance from the point to the line segment
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
      // in case of 0 length line
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
   * Updates width, height, x, y, translateX, and translateY based on current points.
   * Uses the unrotated local points and stroke width for base dimensions.
   * Called during initial setup to establish the path's dimensions and position.
   */
  private updateDimensions(): void {
    const minX = Math.min(...this.points.map(p => p[0])) - this.strokeWidth / 2;
    const minY = Math.min(...this.points.map(p => p[1])) - this.strokeWidth / 2;

    const maxX = Math.max(...this.points.map(p => p[0])) + this.strokeWidth / 2;
    const maxY = Math.max(...this.points.map(p => p[1])) + this.strokeWidth / 2;

    this.width = maxX - minX + this.lineSlack;
    this.height = maxY - minY + this.lineSlack;

    this.x = minX;
    this.y = minY;

    this.translateX = (this.x + this.translateX) / this.scale;
    this.translateY = (this.y + this.translateY) / this.scale;
  }

  /**
   * Updates width, height, x, y based on current points and strokeWidth.
   * Does NOT modify translateX/translateY (use updateDimensions for initial setup).
   */
  private updateBoundingBox(): void {
    const minX = Math.min(...this.points.map(p => p[0])) - this.strokeWidth / 2;
    const minY = Math.min(...this.points.map(p => p[1])) - this.strokeWidth / 2;

    const maxX = Math.max(...this.points.map(p => p[0])) + this.strokeWidth / 2;
    const maxY = Math.max(...this.points.map(p => p[1])) + this.strokeWidth / 2;

    this.width = maxX - minX + this.lineSlack;
    this.height = maxY - minY + this.lineSlack;

    this.x = minX;
    this.y = minY;
  }

  /**
   * Generates the SVG path data string from the current points.
   * Uses perfect-freehand to create a smooth, pressure-sensitive stroke.
   * @returns SVG path data string (d attribute value)
   */
  private generateSvgPath(): string {
    const stroke = this.getStrokeFromPoints(this.points, this.strokeWidth);
    const offsetX = this.points.length ? Math.min(...this.points.map(p => p[0])) - this.strokeWidth / 2 : 0;
    const offsetY = this.points.length ? Math.min(...this.points.map(p => p[1])) - this.strokeWidth / 2 : 0;
    return this.getSvgPathFromStroke(stroke, offsetX, offsetY);
  }

  /**
   * Converts raw input points into a smooth stroke outline using perfect-freehand.
   * Applies pressure simulation and smoothing for a natural pen-like appearance.
   * @param points - Array of [x, y] coordinate pairs representing the input path
   * @param strokeWidth - The desired stroke width in pixels
   * @returns Array of [x, y] coordinate pairs forming the stroke outline polygon
   */
  private getStrokeFromPoints(points: number[][], strokeWidth: number): number[][] {
    return getStroke(points, {
      size: strokeWidth,
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
      easing: t => t,
      simulatePressure: true,
      last: true,
      start: {
        cap: true,
        taper: 0,
        easing: t => t,
      },
      end: {
        cap: true,
        taper: 0,
        easing: t => t,
      },
    });
  }

  /**
   * Converts stroke outline points into an SVG path data string.
   * Uses quadratic bezier curves for smooth rendering.
   * Coordinates are emitted relative to (offsetX, offsetY) so the resulting
   * path lives in the object's local coordinate space (paired with a
   * "0 0 width height" viewBox). This keeps SVG-internal coordinates small
   * regardless of the object's world position, avoiding float32 rasterizer
   * precision failures far from the origin.
   * @param points - Array of [x, y] coordinate pairs forming the stroke outline
   * @param offsetX - X origin to subtract from every coordinate (default 0)
   * @param offsetY - Y origin to subtract from every coordinate (default 0)
   * @param closed - Whether to close the path with 'Z' command (default: true)
   * @returns SVG path data string with M, Q, and T commands
   */
  private getSvgPathFromStroke(points: number[][], offsetX = 0, offsetY = 0, closed = true) {
    const len = points.length;

    if (len < 4) {
      return ``;
    }

    const a = points[0];
    const b = points[1];
    const c = points[2];

    const ax = a[0] - offsetX;
    const ay = a[1] - offsetY;
    const bx = b[0] - offsetX;
    const by = b[1] - offsetY;
    const cx = c[0] - offsetX;
    const cy = c[1] - offsetY;

    let result = `M${ax.toFixed(2)},${ay.toFixed(2)} Q${bx.toFixed(2)},${by.toFixed(2)} ${KritzelMathHelper.average(bx, cx).toFixed(
      2,
    )},${KritzelMathHelper.average(by, cy).toFixed(2)} T`;

    for (let i = 2, max = len - 1; i < max; i++) {
      const p = points[i];
      const q = points[i + 1];
      const px = p[0] - offsetX;
      const py = p[1] - offsetY;
      const qx = q[0] - offsetX;
      const qy = q[1] - offsetY;
      result += `${KritzelMathHelper.average(px, qx).toFixed(2)},${KritzelMathHelper.average(py, qy).toFixed(2)} `;
    }

    if (closed) {
      result += 'Z';
    }

    return result;
  }

  /**
   * Determines if the path appears too small on screen for detailed rendering.
   * Used for level-of-detail optimizations.
   * @returns True if the path's screen area is less than 500 square pixels
   */
  isLowRes(): boolean {
    if (!this._core) {
      return false;
    }

    const viewportScale = this._core.store.state.scale;
    const scaledWidth = this.boundingBox.width * viewportScale;
    const scaledHeight = this.boundingBox.height * viewportScale;

    return (scaledWidth * scaledHeight) < 500;
  }

  /**
   * Finds the point where a line from outsidePoint to the path's center
   * intersects the stroke edge. Used for arrow clipping at the actual stroke edge.
   * Uses binary search refinement for accurate intersection detection.
   * @param outsidePoint - A point outside the path to trace from
   * @returns The intersection point on the stroke edge, or null if no intersection found
   */
  getClipPoint(outsidePoint: KritzelPoint): KritzelPoint | null {
    const centerX = this.centerX;
    const centerY = this.centerY;
    const halfStroke = this.strokeWidth / this.scale / 2;

    // Ensure adjusted points are computed
    if (this._adjustedPoints === null) {
      this._adjustedPoints = this.computeAdjustedPoints();
    }

    if (this._adjustedPoints.length < 1) {
      return null;
    }

    // Sample along the line from outsidePoint to center to find stroke edge
    const steps = 32;
    let prevOutside = true;

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const sampleX = outsidePoint.x + (centerX - outsidePoint.x) * t;
      const sampleY = outsidePoint.y + (centerY - outsidePoint.y) * t;

      // Check distance to path stroke
      let minDistance = Infinity;

      if (this._adjustedPoints.length === 1) {
        const p = this._adjustedPoints[0];
        const dx = sampleX - p[0];
        const dy = sampleY - p[1];
        minDistance = Math.sqrt(dx * dx + dy * dy);
      } else {
        for (let j = 0; j < this._adjustedPoints.length - 1; j++) {
          const p1 = this._adjustedPoints[j];
          const p2 = this._adjustedPoints[j + 1];
          const dist = this.pointToLineSegmentDistance(sampleX, sampleY, p1[0], p1[1], p2[0], p2[1]);
          if (dist < minDistance) {
            minDistance = dist;
          }
        }
      }

      const isInside = minDistance <= halfStroke;

      // Found the edge: transition from outside to inside
      if (prevOutside && isInside) {
        // Refine the intersection point using binary search
        let tLow = (i - 1) / steps;
        let tHigh = t;

        for (let k = 0; k < 8; k++) {
          const tMid = (tLow + tHigh) / 2;
          const midX = outsidePoint.x + (centerX - outsidePoint.x) * tMid;
          const midY = outsidePoint.y + (centerY - outsidePoint.y) * tMid;

          let midDist = Infinity;
          if (this._adjustedPoints.length === 1) {
            const p = this._adjustedPoints[0];
            const dx = midX - p[0];
            const dy = midY - p[1];
            midDist = Math.sqrt(dx * dx + dy * dy);
          } else {
            for (let j = 0; j < this._adjustedPoints.length - 1; j++) {
              const p1 = this._adjustedPoints[j];
              const p2 = this._adjustedPoints[j + 1];
              const dist = this.pointToLineSegmentDistance(midX, midY, p1[0], p1[1], p2[0], p2[1]);
              if (dist < midDist) {
                midDist = dist;
              }
            }
          }

          if (midDist <= halfStroke) {
            tHigh = tMid;
          } else {
            tLow = tMid;
          }
        }

        const finalT = (tLow + tHigh) / 2;
        return {
          x: outsidePoint.x + (centerX - outsidePoint.x) * finalT,
          y: outsidePoint.y + (centerY - outsidePoint.y) * finalT,
        };
      }

      prevOutside = !isInside;
    }

    return null;
  }

  getSupportedExportFormats(): KritzelObjectExportFormat[] {
    return ['svg'];
  }

  async exportAs(format: KritzelObjectExportFormat, context: KritzelObjectExportContext): Promise<string | null> {
    if (format !== 'svg') {
      return null;
    }

    return context.getObjectAsSvgDataUrl(this);
  }
}

