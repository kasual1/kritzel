import { getStroke } from 'perfect-freehand';
import { MathHelper } from './math.helper';

export interface PathOptions {
  points: number[][];
  translateX?: number;
  translateY?: number;
  scale?: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Path {
  id: string = '';
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
  showAsImage: boolean = false;
  zIndex: number = 1;
  options: PathOptions | undefined;

  get boundingBox(): BoundingBox {
    return {
      x: this.translateX,
      y: this.translateY,
      width: this.width / this.scale,
      height: this.height / this.scale,
    };
  }

  get transformationMatrix(): string {
    const scale = 1 / this.scale;
    const translateX = this.translateX;
    const translateY = this.translateY;

    return `matrix(${scale}, 0, 0, ${scale}, ${translateX}, ${translateY})`;
  }

  get viewBox(): string {
      return `${this.x} ${this.y} ${this.width} ${this.height}`;
  }

  constructor(options: PathOptions) {
    this.options = options;
    this.id = this.generateId();
    this.points = options.points ?? [];
    this.translateX = options.translateX ?? 0;
    this.translateY = options.translateY ?? 0;
    this.scale = options.scale ?? 1;
    this.stroke = options.stroke ?? 'black';
    this.strokeWidth = options.strokeWidth ?? 8;
    this.fill = options.fill ?? 'black';

    debugger;

    this.d = this.generateSvgPath();


    this.initializeDimensions();
    this.setPosition();
    this.updateTranslation();
  }

  toJSON(): string {
    return JSON.stringify(this.options);
  }

  static fromJSON(json: string): Path {
    return new Path(JSON.parse(json));
  }

  isInViewport(viewport: BoundingBox, scale: number): boolean {
    return (
      this.doesBoundingBoxIntersectViewport(viewport) &&
      this.isLargeEnoughAtScale(scale) &&
      this.isNotTooLargeAtScale(scale)
    );
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private initializeDimensions(): void {
    const padding = this.strokeWidth;
    this.width =
      Math.max(...this.points.map((p) => p[0])) -
      Math.min(...this.points.map((p) => p[0])) +
      padding;
    this.height =
      Math.max(...this.points.map((p) => p[1])) -
      Math.min(...this.points.map((p) => p[1])) +
      padding;
    this.topLeft = [
      Math.min(...this.points.map((p) => p[0])),
      Math.min(...this.points.map((p) => p[1])),
    ];
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

  private getStrokeFromPoints(
    points: number[][],
    strokeWidth: number
  ): number[][] {
    return getStroke(points, {
      size: strokeWidth,
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
      easing: (t) => t,
      simulatePressure: true,
      last: true,
      start: {
        cap: true,
        taper: 0,
        easing: (t) => t,
      },
      end: {
        cap: true,
        taper: 0,
        easing: (t) => t,
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

    let result = `M${a[0].toFixed(2)},${a[1].toFixed(2)} Q${b[0].toFixed(
      2
    )},${b[1].toFixed(2)} ${MathHelper.average(b[0], c[0]).toFixed(
      2
    )},${MathHelper.average(b[1], c[1]).toFixed(2)} T`;

    for (let i = 2, max = len - 1; i < max; i++) {
      a = points[i];
      b = points[i + 1];
      result += `${MathHelper.average(a[0], b[0]).toFixed(
        2
      )},${MathHelper.average(a[1], b[1]).toFixed(2)} `;
    }

    if (closed) {
      result += 'Z';
    }

    return result;
  }

  private doesBoundingBoxIntersectViewport(viewport: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): boolean {
    return (
      this.boundingBox.x <= viewport.x + viewport.width &&
      this.boundingBox.x + this.boundingBox.width >= viewport.x &&
      this.boundingBox.y <= viewport.y + viewport.height &&
      this.boundingBox.y + this.boundingBox.height >= viewport.y
    );
  }

  private isLargeEnoughAtScale(scale: number): boolean {
    return (
      (this.width / this.scale) * scale > 0.5 &&
      (this.height / this.scale) * scale > 0.5
    );
  }

  private isNotTooLargeAtScale(scale: number): boolean {
		return  (scale / this.scale) < 150;
  }
}
