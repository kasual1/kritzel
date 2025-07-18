import { getStroke } from 'perfect-freehand';
import { KritzelMathHelper } from '../../helpers/math.helper';
import { KritzelPathOptions } from '../../interfaces/path-options.interface';
import { KritzelBaseObject } from './base-object.class';
import { KritzelStore } from '../store.class';

export class KritzelPath extends KritzelBaseObject<SVGElement> {
  override __class__: string = 'KritzelPath';

  points: number[][];
  d: string;
  stroke: string = 'none';
  strokeWidth: number;
  lineSlack: number = 0.5;
  fill: string;
  x: number = 0;
  y: number = 0;
  translateX: number;
  translateY: number;
  height: number = 0;
  width: number = 0;
  scale: number = 1;
  visible: boolean = true;
  options: KritzelPathOptions | undefined;

  debugInfoVisible: boolean = true;

  get viewBox(): string {
    return `${this.x} ${this.y} ${this.width} ${this.height}`;
  }

  constructor(config?: {
    points: number[][];
    translateX?: number;
    translateY?: number;
    scale?: number;
    strokeWidth?: number;
    fill?: string;
    lineSlack?: number;
  }) {
    super();
    this.options = config;
    this.points = config?.points ?? [];
    this.translateX = config?.translateX ?? 0;
    this.translateY = config?.translateY ?? 0;
    this.scale = config?.scale ?? 1;
    this.strokeWidth = config?.strokeWidth ?? 8;
    this.fill = config?.fill ?? '#000000';
    this.d = this.generateSvgPath();
    this.updateDimensions();
  }

  static override create(store: KritzelStore, options?: KritzelPathOptions): KritzelPath {
    const object = new KritzelPath();

    object._store = store;
    object.id = object.generateId();
    object.options = options;
    object.points = options?.points ?? [];
    object.translateX = options?.translateX ?? 0;
    object.translateY = options?.translateY ?? 0;
    object.scale = options?.scale ?? 1;
    object.strokeWidth = options?.strokeWidth ?? 8;
    object.fill = options?.fill ?? '#000000';
    object.zIndex = store.currentZIndex;
    object.d = object.generateSvgPath();
    object.updateDimensions();

    return object;
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

    this.width = Math.max(...this.points.map(p => p[0])) - Math.min(...this.points.map(p => p[0])) + this.strokeWidth;
    this.height = Math.max(...this.points.map(p => p[1])) - Math.min(...this.points.map(p => p[1])) + this.strokeWidth;

    this.x = Math.min(...this.points.map(p => p[0])) - this.strokeWidth / 2;
    this.y = Math.min(...this.points.map(p => p[1])) - this.strokeWidth / 2;

    this.translateX = x;
    this.translateY = y;
  }

  override rotate(value: number): void {
    super.rotate(value);
    this.updateDimensions();
  }

  private updateDimensions(): void {
    debugger;

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
}
