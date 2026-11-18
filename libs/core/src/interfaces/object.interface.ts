import { UpmadeBaseObject } from '../classes/objects/base-object.class';
import { UpmadeBoundingBox } from './bounding-box.interface';
import { UpmadePolygon } from './polygon.interface';
import { ThemeAwareColor } from '../constants/color-palette.constants';

export interface UpmadeObject<T = Element> {
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
  get boundingBox(): UpmadeBoundingBox;
  get totalWidth(): number;
  get totalHeight(): number;
  get rotationDegrees(): number;
  get centerX(): number;
  get centerY(): number;

  mount(element: T): void;
  generateId(): string;
  isInViewport(viewport: UpmadeBoundingBox, scale: number): boolean;
  centerInViewport(): void;
  update(): void;
  move(startX: number, startY: number, endX: number, endY: number): void;
  resize(x: number, y: number, width: number, height: number): void;
  rotate(value: number): void;
  copy(): UpmadeBaseObject<Element>;
  isClass<T extends UpmadeBaseObject>(this: T, type: string): this is T;
  edit(event?: PointerEvent): void;
  hitTest(x: number, y: number): boolean;
  hitTestPolygon(polygon: UpmadePolygon): boolean;
  updatePosition(x: number, y: number): void;
}
