import { KritzelBaseObject } from '../classes/objects/base-object.class';
import { KritzelBoundingBox } from './bounding-box.interface';
import { KritzelPolygon } from './polygon.interface';
import { ThemeAwareColor } from '../constants/color-palette.constants';

export interface KritzelObject<T = Element> {
  _elementRef: T;

  id: string;
  workspaceId: string;
  x: number;
  y: number;
  translateX: number;
  translateY: number;
  height: number;
  width: number;
  backgroundColor?: ThemeAwareColor;
  borderColor?: ThemeAwareColor;
  borderWidth: number;
  opacity: number;
  scale?: number;
  resizing: boolean;
  rotation: number;
  markedForRemoval: boolean;
  zIndex: number;
  userId?: string;
  name?: string;

  isVisible: boolean;
  isSelected: boolean;
  isHovered: boolean;
  isMounted: boolean;
  isEditable: boolean;
  isInteractive: boolean;

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
  update(): void;
  move(startX: number, startY: number, endX: number, endY: number): void;
  resize(x: number, y: number, width: number, height: number): void;
  rotate(value: number): void;
  copy(): KritzelBaseObject<Element>;
  isClass<T extends KritzelBaseObject>(this: T, type: string): this is T;
  edit(event?: PointerEvent): void;
  hitTest(x: number, y: number): boolean;
  hitTestPolygon(polygon: KritzelPolygon): boolean;
  updatePosition(x: number, y: number): void;
}

/** Options shared by all object configs. */
export interface KritzelObjectCommonConfig {
  /** User-facing name, shown as the title of the object's titlebar. */
  name?: string;
}
