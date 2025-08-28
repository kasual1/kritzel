import { KritzelBaseObject } from '../classes/objects/base-object.class';
import { KritzelBoundingBox } from './bounding-box.interface';
import { KritzelPolygon } from './polygon.interface';

export interface KritzelObject<T = Element> {
  _elementRef: T;

  id: string;
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
  resizing: boolean;
  rotation: number;
  markedForRemoval: boolean;
  zIndex: number;

  isVisible: boolean;
  isSelected: boolean;
  isHovered: boolean;
  isMounted: boolean;
  isEditable: boolean;
  isInteractive: boolean;
  isDebugInfoVisible: boolean;

  set elementRef(element: T);
  get elementRef(): T;
  get boundingBox(): KritzelBoundingBox;
  get totalWidth(): number;
  get totalHeight(): number;
  get rotationDegrees(): number;
  get centerX(): number;
  get centerY(): number;

  mount(element: T): void;
  unmount(): void;
  remount(): void;
  generateId(): string;
  isInViewport(viewport: KritzelBoundingBox, scale: number): boolean;
  centerInViewport(): void;
  move(startX: number, startY: number, endX: number, endY: number): void;
  resize(x: number, y: number, width: number, height: number): void;
  rotate(value: number): void;
  copy(): KritzelBaseObject<Element>;
  onSelectedClick(): void;
  isClass<T extends KritzelBaseObject>(this: T, type: string): this is T;
  edit(): void;
  hitTest(x: number, y: number): boolean;
  hitTestPolygon(polygon: KritzelPolygon): boolean;
  updatePosition(x: number, y: number): void;
}
