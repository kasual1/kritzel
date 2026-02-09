import { getStroke } from 'perfect-freehand';
import { KritzelMathHelper } from '../../helpers/math.helper';
import { KritzelPathOptions } from '../../interfaces/path-options.interface';
import { KritzelBaseObject } from './base-object.class';
import { KritzelPolygon } from '../../interfaces/polygon.interface';
import { KritzelGeometryHelper } from '../../helpers/geometry.helper';
import { KritzelPoint } from '../../interfaces/point.interface';
import { KritzelCore } from '../core/core.class';
import { ThemeAwareColor } from '../../constants/color-palette.constants';

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
  options: KritzelPathOptions | undefined;

  isVisible: boolean = true;
  isDebugInfoVisible: boolean = true;
  isCompleted: boolean = false;

  private _adjustedPoints?: number[][] = null;

  get viewBox(): string {
    return `${this.x} ${this.y} ${this.width} ${this.height}`;
  }

  constructor(config?: { points: number[][]; translateX?: number; translateY?: number; scale?: number; strokeWidth?: number; fill?: ThemeAwareColor; lineSlack?: number }) {
    super();
    this.options = config;
    this.points = config?.points ?? [];
    this.translateX = config?.translateX ?? 0;
    this.translateY = config?.translateY ?? 0;
    this.scale = config?.scale ?? 1;
    this.strokeWidth = config?.strokeWidth ?? 8;
    this.fill = config?.fill ?? { light: '#000000', dark: '#ffffff' };
    this.d = this.generateSvgPath();
    this.updateDimensions();
  }

  static override create(core: KritzelCore, options?: KritzelPathOptions): KritzelPath {
    const object = new KritzelPath();

    object._core = core;
    object.id = object.generateId();
    object.workspaceId = core.store.state.activeWorkspace.id;
    object.options = options;
    object.points = options?.points ?? [];
    object.translateX = options?.translateX ?? 0;
    object.translateY = options?.translateY ?? 0;
    object.scale = options?.scale ?? 1;
    object.strokeWidth = options?.strokeWidth ?? 8;
    object.fill = options?.fill ?? { light: '#000000', dark: '#ffffff' };
    object.opacity = options?.opacity ?? 1;
    object.zIndex = core.store.currentZIndex;
    object.d = object.generateSvgPath();
    object.updateDimensions();

    return object;
  }

  override resize(x: number | null, y: number | null, width: number, height: number): void {
    if (width <= 1 || height <= 1) {
      return;
    }

    const scaleX = width / this.width;
    const scaleY = height / this.height;

    this.width = width;
    this.height = height;

    this.points = this.points.map(([x, y]) => [x * scaleX, y * scaleY]);
    this.d = this.generateSvgPath();

    this.width = Math.max(...this.points.map(p => p[0])) - Math.min(...this.points.map(p => p[0])) + this.strokeWidth;
    this.height = Math.max(...this.points.map(p => p[1])) - Math.min(...this.points.map(p => p[1])) + this.strokeWidth;

    this.x = Math.min(...this.points.map(p => p[0])) - this.strokeWidth / 2;
    this.y = Math.min(...this.points.map(p => p[1])) - this.strokeWidth / 2;

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

  override updatePosition(x: number, y: number): void {
    this.translateX = x;
    this.translateY = y;
    this._adjustedPoints = null;
    this._core.store.state.objects.update(this);
  }

  override onAfterUpdate(changedProperties: string[]): void {
    if (changedProperties.includes('strokeWidth')) {
      this.d = this.generateSvgPath();
      this.updateBoundingBox();
      this._adjustedPoints = null;
    }
  }

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

  private updateDimensions(): void {
    const rotatedPoints = this.points.map(([x, y]) => {
      const rotatedX = x * Math.cos(this.rotation) - y * Math.sin(this.rotation);
      const rotatedY = x * Math.sin(this.rotation) + y * Math.cos(this.rotation);
      return [rotatedX, rotatedY];
    });

    const minX = Math.min(...rotatedPoints.map(p => p[0] - this.strokeWidth / 2));
    const minY = Math.min(...rotatedPoints.map(p => p[1] - this.strokeWidth / 2));

    const maxX = Math.max(...rotatedPoints.map(p => p[0] + this.strokeWidth / 2));
    const maxY = Math.max(...rotatedPoints.map(p => p[1] + this.strokeWidth / 2));

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
    const rotatedPoints = this.points.map(([x, y]) => {
      const rotatedX = x * Math.cos(this.rotation) - y * Math.sin(this.rotation);
      const rotatedY = x * Math.sin(this.rotation) + y * Math.cos(this.rotation);
      return [rotatedX, rotatedY];
    });

    const minX = Math.min(...rotatedPoints.map(p => p[0] - this.strokeWidth / 2));
    const minY = Math.min(...rotatedPoints.map(p => p[1] - this.strokeWidth / 2));

    const maxX = Math.max(...rotatedPoints.map(p => p[0] + this.strokeWidth / 2));
    const maxY = Math.max(...rotatedPoints.map(p => p[1] + this.strokeWidth / 2));

    this.width = maxX - minX + this.lineSlack;
    this.height = maxY - minY + this.lineSlack;

    this.x = minX;
    this.y = minY;
  }

  private generateSvgPath(): string {
    const stroke = this.getStrokeFromPoints(this.points, this.strokeWidth);
    return this.getSvgPathFromStroke(stroke);
  }

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

  private getSvgPathFromStroke(points: number[][], closed = true) {
    const len = points.length;

    if (len < 4) {
      return ``;
    }

    let a = points[0];
    let b = points[1];
    const c = points[2];

    let result = `M${a[0].toFixed(2)},${a[1].toFixed(2)} Q${b[0].toFixed(2)},${b[1].toFixed(2)} ${KritzelMathHelper.average(b[0], c[0]).toFixed(
      2,
    )},${KritzelMathHelper.average(b[1], c[1]).toFixed(2)} T`;

    for (let i = 2, max = len - 1; i < max; i++) {
      a = points[i];
      b = points[i + 1];
      result += `${KritzelMathHelper.average(a[0], b[0]).toFixed(2)},${KritzelMathHelper.average(a[1], b[1]).toFixed(2)} `;
    }

    if (closed) {
      result += 'Z';
    }

    return result;
  }

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
   * intersects the stroke edge. Returns null if no intersection found.
   * This is used for arrow clipping at the actual stroke edge.
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
}

