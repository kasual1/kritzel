import { getStroke } from 'perfect-freehand';
import { KritzelMathHelper } from '../../helpers/math.helper';
import { BoundingBox } from 'puppeteer';
import { KritzelPathOptions } from '../../interfaces/path-options.interface';
import { KritzelBaseObject } from './base-object.class';

export class KritzelPath extends KritzelBaseObject<SVGElement> {
  points: number[][];
  d: string;
  stroke: string;
  strokeWidth: number;
  fill: string;
  x: number = 0;
  y: number = 0;
  translateX: number;
  translateY: number;
  height: number = 0;
  width: number = 0;
  scale: number = 1;
  topLeft: number[] = [0, 0];
  visible: boolean = true;
  options: KritzelPathOptions | undefined;

  debugInfoVisible: boolean = true;

  corners: { x: number; y: number }[] = [];
  rotatedCorners: { x: number; y: number }[] = [];

  override get boundingBox(): any {
    const minX = Math.min(...this.points.map(p => p[0]));
    const minY = Math.min(...this.points.map(p => p[1]));
    const maxX = Math.max(...this.points.map(p => p[0]));
    const maxY = Math.max(...this.points.map(p => p[1]));

    this.corners = [
      { x: minX, y: minY }, // Top left
      { x: maxX, y: minY }, // Top right
      { x: maxX, y: maxY }, // Bottom right
      { x: minX, y: maxY }, // Bottom left
    ];

    let minXOriginal = this.corners[0].x;
    let minYOriginal = this.corners[0].y;

    const rotatedPoints = this.points.map(([x, y]) => {
      const rotatedX = x * Math.cos(this.rotation) - y * Math.sin(this.rotation);
      const rotatedY = x * Math.sin(this.rotation) + y * Math.cos(this.rotation);
      return [rotatedX, rotatedY];
    });

    const minXRotated = Math.min(...rotatedPoints.map(p => p[0]));
    const minYRotated = Math.min(...rotatedPoints.map(p => p[1]));
    const maxXRotated = Math.max(...rotatedPoints.map(p => p[0]));
    const maxYRotated = Math.max(...rotatedPoints.map(p => p[1]));

    this.rotatedCorners = [
      { x: minXRotated, y: minYRotated }, // Top left
      { x: maxXRotated, y: minYRotated }, // Top right
      { x: maxXRotated, y: maxYRotated }, // Bottom right
      { x: minXRotated, y: maxYRotated }, // Bottom left
    ];

    const width = Math.floor(maxXRotated - minXRotated);
    const height = Math.floor(maxYRotated - minYRotated);

    const halfWidth = width / this.scale / 2;
    const halfHeight = height / this.scale / 2;

    // Calculate the corners of the unrotated rectangle
    this.corners = [
      { x: -halfWidth, y: -halfHeight }, // Top left
      { x: halfWidth, y: -halfHeight }, // Top right
      { x: halfWidth, y: halfHeight }, // Bottom right
      { x: -halfWidth, y: halfHeight }, // Bottom left
    ];


    return {
      x: this.translateX,
      y: this.translateY,
      minX: (this.totalWidth - width) / 2,
      minY: (this.totalHeight - height) / 2,
      width: (maxXRotated - minXRotated) + this.padding,
      height: (maxYRotated - minYRotated) + this.padding,
    };
  }

  constructor(options: KritzelPathOptions) {
    super();
    this.options = options;
    this.points = options.points ?? [];
    this.translateX = options.translateX ?? 0;
    this.translateY = options.translateY ?? 0;
    this.scale = options.scale ?? 1;
    this.stroke = options.stroke ?? 'black';
    this.strokeWidth = options.strokeWidth ?? 8;
    this.fill = options.fill ?? 'black';
    this.zIndex = 9999;

    this.d = this.generateSvgPath();

    this.updateDimensions();
    this.setPosition();
    this.updateTranslation();
  }

  isInViewport(viewport: BoundingBox, scale: number): boolean {
    return this.doesBoundingBoxIntersectViewport(viewport) && this.isLargeEnoughAtScale(scale) && this.isNotTooLargeAtScale(scale);
  }

  resize(x: number | null, y: number | null, width: number, height: number): void {
    if (width <= 1 || height <= 1) {
      return;
    }

    const scaleX = width / this.width;
    const scaleY = height / this.height;

    this.width = width;
    this.height = height;

    this.points = this.points.map(([x, y]) => [x * scaleX, y * scaleY]);
    this.d = this.generateSvgPath();

    const padding = this.strokeWidth;
    this.width = Math.max(...this.points.map(p => p[0])) - Math.min(...this.points.map(p => p[0])) + padding;
    this.height = Math.max(...this.points.map(p => p[1])) - Math.min(...this.points.map(p => p[1])) + padding;
    this.topLeft = [Math.min(...this.points.map(p => p[0])), Math.min(...this.points.map(p => p[1]))];

    this.x = this.topLeft[0] - padding / 2;
    this.y = this.topLeft[1] - padding / 2;
    this.translateX = x;
    this.translateY = y;
  }

  override rotate(value: number): void {
    super.rotate(value);
    this.updateDimensions();
  }

  private updateDimensions(): void {
    const padding = this.strokeWidth;
    const rotatedPoints = this.points.map(([x, y]) => {
      const rotatedX = x * Math.cos(this.rotation) - y * Math.sin(this.rotation);
      const rotatedY = x * Math.sin(this.rotation) + y * Math.cos(this.rotation);
      return [rotatedX, rotatedY];
    });

    this.width = Math.max(...rotatedPoints.map(p => p[0])) - Math.min(...rotatedPoints.map(p => p[0])) + padding;
    this.height = Math.max(...rotatedPoints.map(p => p[1])) - Math.min(...rotatedPoints.map(p => p[1])) + padding;
    this.topLeft = [Math.min(...rotatedPoints.map(p => p[0])), Math.min(...rotatedPoints.map(p => p[1]))];
  }

  private setPosition(): void {
    const padding = this.strokeWidth;
    this.x = this.topLeft[0] - padding / 2;
    this.y = this.topLeft[1] - padding / 2;
  }

  private updateTranslation(): void {
    this.translateX = (this.x + this.translateX) / this.scale;
    this.translateY = (this.y + this.translateY) / this.scale;
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

  private doesBoundingBoxIntersectViewport(viewport: { x: number; y: number; width: number; height: number }): boolean {
    return (
      this.boundingBox.x <= viewport.x + viewport.width &&
      this.boundingBox.x + this.boundingBox.width >= viewport.x &&
      this.boundingBox.y <= viewport.y + viewport.height &&
      this.boundingBox.y + this.boundingBox.height >= viewport.y
    );
  }

  private isLargeEnoughAtScale(scale: number): boolean {
    return (this.width / this.scale) * scale > 0.5 && (this.height / this.scale) * scale > 0.5;
  }

  private isNotTooLargeAtScale(scale: number): boolean {
    return scale / this.scale < 150;
  }
}
