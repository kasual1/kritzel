import { KritzelBoundingBox } from '../../interfaces/bounding-box.interface';
import { KritzelObject } from '../../interfaces/object.interface';
import { KritzelPolygon } from '../../interfaces/polygon.interface';
import { KritzelSerializable } from '../../interfaces/serializable.interface';
import { ObjectHelper } from '../../helpers/object.helper';
import { KritzelGeometryHelper } from '../../helpers/geometry.helper';
import { KritzelCore } from '../core/core.class';
import { KritzelClonable } from '../../interfaces/clonable.interface';

export class KritzelBaseObject<T extends Element = HTMLElement | SVGElement> implements KritzelObject<T>, KritzelSerializable, KritzelClonable<KritzelBaseObject<T>> {
  __class__: string = 'KritzelBaseObject';

  _core: KritzelCore;
  _elementRef: T;

  id: string;
  workspaceId: string;
  x: number;
  y: number;
  translateX: number;
  translateY: number;
  height: number;
  width: number;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number = 0;
  opacity: number = 1;
  padding: number = 0;
  scale: number;
  resizing: boolean = false;
  rotation: number = 0;
  markedForRemoval: boolean = false;
  zIndex: number = 0;

  isVisible: boolean = true;
  isSelected: boolean = false;
  isHovered: boolean = false;
  isMounted: boolean = false;
  isEditable: boolean = false;
  isInteractive: boolean = false;
  isDebugInfoVisible: boolean = false;

  get totalWidth(): number {
    return this.width + this.padding * 2;
  }

  get totalHeight(): number {
    return this.height + this.padding * 2;
  }

  set elementRef(element: T) {
    this._elementRef = element;
  }

  get elementRef(): T {
    return this._elementRef;
  }

  get boundingBox(): KritzelBoundingBox {
    return {
      x: this.translateX,
      y: this.translateY,
      z: this.scale,
      width: this.totalWidth / this.scale,
      height: this.totalHeight / this.scale,
    };
  }

  get rotatedBoundingBox(): KritzelBoundingBox {
    return {
      x: this.minXRotated,
      y: this.minYRotated,
      z: this.scale,
      width: this.maxXRotated - this.minXRotated,
      height: this.maxYRotated - this.minYRotated,
    };
  }

  get rotatedPolygon(): KritzelPolygon {
    const cx = this.translateX + this.totalWidth / 2 / this.scale;
    const cy = this.translateY + this.totalHeight / 2 / this.scale;
    const angle = this.rotation;

    const adjustedWidth = this.totalWidth / this.scale;
    const adjustedHeight = this.totalHeight / this.scale;

    const corners = {
      topLeft: { x: this.translateX, y: this.translateY },
      topRight: { x: this.translateX + adjustedWidth, y: this.translateY },
      bottomRight: { x: this.translateX + adjustedWidth, y: this.translateY + adjustedHeight },
      bottomLeft: { x: this.translateX, y: this.translateY + adjustedHeight },
    };

    const rotatedCorners = Object.keys(corners).reduce((acc, key) => {
      const corner = corners[key];
      const rotatedX = Math.cos(angle) * (corner.x - cx) - Math.sin(angle) * (corner.y - cy) + cx;
      const rotatedY = Math.sin(angle) * (corner.x - cx) + Math.cos(angle) * (corner.y - cy) + cy;
      acc[key] = { x: rotatedX, y: rotatedY };
      return acc;
    }, {});

    return rotatedCorners as KritzelPolygon;
  }

  get minXRotated(): number {
    const corners = [this.rotatedPolygon.topLeft.x, this.rotatedPolygon.topRight.x, this.rotatedPolygon.bottomRight.x, this.rotatedPolygon.bottomLeft.x];

    return Math.min(...corners);
  }

  get minYRotated(): number {
    const corners = [this.rotatedPolygon.topLeft.y, this.rotatedPolygon.topRight.y, this.rotatedPolygon.bottomRight.y, this.rotatedPolygon.bottomLeft.y];

    return Math.min(...corners);
  }

  get maxXRotated(): number {
    const corners = [this.rotatedPolygon.topLeft.x, this.rotatedPolygon.topRight.x, this.rotatedPolygon.bottomRight.x, this.rotatedPolygon.bottomLeft.x];

    return Math.max(...corners);
  }

  get maxYRotated(): number {
    const corners = [this.rotatedPolygon.topLeft.y, this.rotatedPolygon.topRight.y, this.rotatedPolygon.bottomRight.y, this.rotatedPolygon.bottomLeft.y];

    return Math.max(...corners);
  }

  get transformationMatrix(): string {
    const scale = 1 / this.scale;
    const translateX = this.translateX;
    const translateY = this.translateY;

    return `matrix(${scale}, 0, 0, ${scale}, ${translateX}, ${translateY})`;
  }

  get rotationDegrees(): number {
    return this.rotation * (180 / Math.PI);
  }

  get centerX(): number {
    return this.translateX + this.totalWidth / 2;
  }

  get centerY(): number {
    return this.translateY + this.totalHeight / 2;
  }

  constructor() {
    this.id = this.generateId();
  }

  static create(core: KritzelCore): KritzelBaseObject<Element> {
    const object = new KritzelBaseObject();

    object._core = core;
    object.zIndex = core.store.currentZIndex;
    object.workspaceId = core.store.state.activeWorkspace.id;

    return object;
  }

  mount(element: T): void {
    if (this.isMounted) {
      return;
    }

    this.elementRef = element;
    this.isMounted = true;
  }

  unmount(): void {
    if (!this.isMounted) {
      return;
    }

    this.isMounted = false;
  }

  remount(): void {
    if (!this.isMounted) {
      return;
    }

    this.isMounted = false;
  }

  generateId(): string {
    return ObjectHelper.generateUUID();
  }

  isInViewport(): boolean {
    const viewportBounds: KritzelBoundingBox = {
      x: -this._core.store.state.translateX / this._core.store.state.scale,
      y: -this._core.store.state.translateY / this._core.store.state.scale,
      z: this._core.store.state.scale,
      width: this._core.store.state.viewportWidth / this._core.store.state.scale,
      height: this._core.store.state.viewportHeight / this._core.store.state.scale,
    };

    return (
      this.rotatedBoundingBox.x < viewportBounds.x + viewportBounds.width &&
      this.rotatedBoundingBox.x + this.rotatedBoundingBox.width > viewportBounds.x &&
      this.rotatedBoundingBox.y < viewportBounds.y + viewportBounds.height &&
      this.rotatedBoundingBox.y + this.rotatedBoundingBox.height > viewportBounds.y
    );
  }

  centerInViewport(): void {
    const { viewportWidth, viewportHeight, translateX: viewportTranslateX, translateY: viewportTranslateY, scale: viewportScale } = this._core.store.state;
    const { x, y, width, height } = this.rotatedBoundingBox;

    const objectCenterX = x + width / 2;
    const objectCenterY = y + height / 2;

    const targetCenterX = (viewportWidth / 2 - viewportTranslateX) / viewportScale;
    const targetCenterY = (viewportHeight / 2 - viewportTranslateY) / viewportScale;

    const deltaX = targetCenterX - objectCenterX;
    const deltaY = targetCenterY - objectCenterY;

    this.updatePosition(this.translateX + deltaX, this.translateY + deltaY);
  }

  move(startX: number, startY: number, endX: number, endY: number): void {
    const deltaX = (startX - endX) / this._core.store.state.scale;
    const deltaY = (startY - endY) / this._core.store.state.scale;

    this.translateX += deltaX;
    this.translateY += deltaY;
  }

  resize(x: number, y: number, width: number, height: number): void {
    if (width <= 1 || height <= 1) {
      return;
    }

    this.width = width;
    this.height = height;
    this.translateX = x;
    this.translateY = y;
  }

  rotate(value: number): void {
    this.rotation = value;
  }

  clone(): KritzelBaseObject<T> {
    const clone = new KritzelBaseObject<T>();
    Object.assign(clone, this);
    return clone;
  }

  copy(): KritzelBaseObject<T> {
    const copiedObject: KritzelBaseObject<T> = Object.create(Object.getPrototypeOf(this));
    Object.assign(copiedObject, this);
    copiedObject.id = this.generateId();
    copiedObject.isMounted = false;
    return copiedObject;
  }

  onSelectedClick(): void {
    // This method can be overridden by subclasses to handle click events when the object is selected.
  }

  serialize() {
    const { _core, _elementRef, element, totalWidth, totalHeight, ...remainingProps } = this as any;

    const clonedProps = structuredClone(remainingProps);

    if (element && typeof element === 'object' && 'nodeType' in element && element.nodeType === 1) {
      clonedProps.element = element.cloneNode(true) as HTMLElement;
    }

    return clonedProps;
  }

  deserialize(object: any): KritzelBaseObject<T> {
    Object.assign(this, object);
    return this;
  }

  isClass<T extends KritzelBaseObject>(this: T, className: string): this is T {
    return this.__class__ === className;
  }

  edit(): void {
    // This method can be overridden by subclasses to handle edit actions.
  }

  hitTest(_x: number, _y: number): boolean {
    return true; // Default implementation, can be overridden by subclasses
  }

  hitTestPolygon(polygon: KritzelPolygon): boolean {
    const objectPolygon = this.rotatedPolygon;
    return KritzelGeometryHelper.doPolygonsIntersect(objectPolygon, polygon);
  }

  updatePosition(x: number, y: number): void {
    this.translateX = x;
    this.translateY = y;
    this._core.store.state.objectsMap.update(this);
  }

}
