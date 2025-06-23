import { KritzelBaseObject } from '../classes/objects/base-object.class';
import { KritzelBoundingBox } from './bounding-box.interface';

export interface KritzelObject<T = Element> {
  id: string;
  visible: boolean;
  x: number;
  y: number;
  translateX: number;
  translateY: number;
  height: number;
  width: number;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  opacity: number;
  scale: number;
  selected: boolean;
  resizing: boolean;
  rotation: number;
  markedForRemoval: boolean;
  isMounted: boolean;
  zIndex: number;

  _elementRef: T;

  set elementRef(element: T);
  get elementRef(): T;
  get boundingBox(): KritzelBoundingBox;
  get totalWidth(): number;
  get totalHeight(): number;
  get rotationDegrees(): number;
  get centerX(): number;
  get centerY(): number;

  mount(element: T): void;
  generateId(): string;
  isInViewport(viewport: KritzelBoundingBox, scale: number): boolean;
  centerInViewport(): void;
  move(startX: number, startY: number, endX: number, endY: number): void;
  resize(x: number, y: number, width: number, height: number): void;
  rotate(value: number): void;
  copy(): KritzelBaseObject<T>;
}
