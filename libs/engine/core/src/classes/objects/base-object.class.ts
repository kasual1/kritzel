import { KritzelBoundingBox } from '../../interfaces/bounding-box.interface';
import { KritzelObject } from '../../interfaces/object.interface';
import { KritzelPolygon } from '../../interfaces/polygon.interface';
import { KritzelSerializable } from '../../interfaces/serializable.interface';
import { ObjectHelper } from '../../helpers/object.helper';
import { KritzelGeometryHelper } from '../../helpers/geometry.helper';
import { KritzelCore } from '../core/core.class';
import { KritzelClonable } from '../../interfaces/clonable.interface';
import { ThemeAwareColor } from '../../constants/color-palette.constants';

/**
 * Base class for all objects that can be rendered on the Kritzel canvas.
 * Provides common functionality for positioning, transformation, hit testing,
 * serialization, and lifecycle management.
 * @template T - The type of the underlying DOM element (HTMLElement or SVGElement)
 */
export class KritzelBaseObject<T extends Element = HTMLElement | SVGElement> implements KritzelObject<T>, KritzelSerializable, KritzelClonable<KritzelBaseObject<T>> {
  __class__: string = 'KritzelBaseObject';

  _core!: KritzelCore;
  _elementRef!: T;

  id: string;
  workspaceId!: string;
  x!: number;
  y!: number;
  translateX!: number;
  translateY!: number;
  height!: number;
  width!: number;
  backgroundColor?: ThemeAwareColor;
  borderColor?: ThemeAwareColor;
  borderWidth: number = 0;
  opacity: number = 1;
  padding: number = 0;
  scale?: number;
  resizing: boolean = false;
  rotation: number = 0;
  markedForRemoval: boolean = false;
  zIndex: number = 0;
  userId?: string;
  /** User-facing name, shown as the title of the object's titlebar. Persisted and synced. */
  name?: string;

  isVisible: boolean = true;
  isSelected: boolean = false;
  isHovered: boolean = false;
  isMounted: boolean = false;
  isEditable: boolean = false;
  isInteractive: boolean = false;
  isResizable: boolean = true;
  isRotatable: boolean = true;

  /**
   * Gets the total width of the object including padding.
   * @returns The width plus double the padding value
   */
  get totalWidth(): number {
    return this.width + this.padding * 2;
  }

  /**
   * Gets the total height of the object including padding.
   * @returns The height plus double the padding value
   */
  get totalHeight(): number {
    return this.height + this.padding * 2;
  }

  /**
   * Sets the underlying DOM element reference for this object.
   * @param element - The DOM element to associate with this object
   */
  set elementRef(element: T) {
    this._elementRef = element;
  }

  /**
   * Gets the underlying DOM element reference for this object.
   * @returns The associated DOM element
   */
  get elementRef(): T {
    return this._elementRef;
  }

  /**
   * Gets the axis-aligned bounding box of the object without rotation.
   * @returns The bounding box with position, scale, and dimensions
   */
  get boundingBox(): KritzelBoundingBox {
    return {
      x: this.translateX,
      y: this.translateY,
      z: this.scale,
      width: this.totalWidth / this.scale,
      height: this.totalHeight / this.scale,
    };
  }

  /**
   * Gets the axis-aligned bounding box that encompasses the rotated object.
   * Calculates the smallest rectangle that contains all four rotated corners.
   * @returns The bounding box accounting for rotation
   */
  get rotatedBoundingBox(): KritzelBoundingBox {
    const polygon = this.rotatedPolygon;
    const xValues = [polygon.topLeft.x, polygon.topRight.x, polygon.bottomRight.x, polygon.bottomLeft.x];
    const yValues = [polygon.topLeft.y, polygon.topRight.y, polygon.bottomRight.y, polygon.bottomLeft.y];

    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);

    return {
      x: minX,
      y: minY,
      z: this.scale,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Gets the four corners of the object as a polygon, accounting for rotation.
   * Uses optimized trigonometric calculations with precomputed cos/sin values.
   * @returns A polygon with topLeft, topRight, bottomRight, and bottomLeft coordinates
   */
  get rotatedPolygon(): KritzelPolygon {
    const cx = this.translateX + this.totalWidth / 2 / this.scale;
    const cy = this.translateY + this.totalHeight / 2 / this.scale;
    const angle = this.rotation;
    
    // Optimization: Precomputes cos/sin once
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const adjustedWidth = this.totalWidth / this.scale;
    const adjustedHeight = this.totalHeight / this.scale;
    
    const x1 = this.translateX;
    const y1 = this.translateY;
    const x2 = x1 + adjustedWidth;
    const y2 = y1 + adjustedHeight;

    // Helper to rotate a point around center
    const rotate = (x: number, y: number) => ({
      x: cos * (x - cx) - sin * (y - cy) + cx,
      y: sin * (x - cx) + cos * (y - cy) + cy,
    });

    return {
      topLeft: rotate(x1, y1),
      topRight: rotate(x2, y1),
      bottomRight: rotate(x2, y2),
      bottomLeft: rotate(x1, y2),
    };
  }

  /**
   * Gets the minimum X coordinate among all rotated corners.
   * @returns The leftmost X coordinate of the rotated object
   */
  get minXRotated(): number {
    const corners = [this.rotatedPolygon.topLeft.x, this.rotatedPolygon.topRight.x, this.rotatedPolygon.bottomRight.x, this.rotatedPolygon.bottomLeft.x];

    return Math.min(...corners);
  }

  /**
   * Gets the minimum Y coordinate among all rotated corners.
   * @returns The topmost Y coordinate of the rotated object
   */
  get minYRotated(): number {
    const corners = [this.rotatedPolygon.topLeft.y, this.rotatedPolygon.topRight.y, this.rotatedPolygon.bottomRight.y, this.rotatedPolygon.bottomLeft.y];

    return Math.min(...corners);
  }

  /**
   * Gets the maximum X coordinate among all rotated corners.
   * @returns The rightmost X coordinate of the rotated object
   */
  get maxXRotated(): number {
    const corners = [this.rotatedPolygon.topLeft.x, this.rotatedPolygon.topRight.x, this.rotatedPolygon.bottomRight.x, this.rotatedPolygon.bottomLeft.x];

    return Math.max(...corners);
  }

  /**
   * Gets the maximum Y coordinate among all rotated corners.
   * @returns The bottommost Y coordinate of the rotated object
   */
  get maxYRotated(): number {
    const corners = [this.rotatedPolygon.topLeft.y, this.rotatedPolygon.topRight.y, this.rotatedPolygon.bottomRight.y, this.rotatedPolygon.bottomLeft.y];

    return Math.max(...corners);
  }

  /**
   * Gets the CSS transformation matrix string for positioning and scaling.
   * @returns A CSS matrix() function string combining scale and translation
   */
  get transformationMatrix(): string {
    const scale = 1 / this.scale;
    const translateX = this.translateX;
    const translateY = this.translateY;

    return `matrix(${scale}, 0, 0, ${scale}, ${translateX}, ${translateY})`;
  }

  /**
   * Gets the rotation angle converted from radians to degrees.
   * @returns The rotation angle in degrees
   */
  get rotationDegrees(): number {
    return this.rotation * (180 / Math.PI);
  }

  /**
   * Gets the X coordinate of the object's center point.
   * @returns The center X position in world coordinates
   */
  get centerX(): number {
    return this.translateX + this.totalWidth / 2 / this.scale;
  }

  /**
   * Gets the Y coordinate of the object's center point.
   * @returns The center Y position in world coordinates
   */
  get centerY(): number {
    return this.translateY + this.totalHeight / 2 / this.scale;
  }

  /**
   * Creates a new KritzelBaseObject instance with a generated unique ID.
   */
  constructor() {
    this.id = this.generateId();
  }

  /**
   * Factory method to create a new KritzelBaseObject with core context.
   * Automatically assigns the current z-index and active workspace ID.
   * @param core - The KritzelCore instance providing context and state
   * @returns A new KritzelBaseObject instance configured with core context
   */
  static create(core: KritzelCore): KritzelBaseObject<Element> {
    const object = new KritzelBaseObject();

    object._core = core;
    object.zIndex = core.store.currentZIndex;
    object.workspaceId = core.store.state.activeWorkspace!.id;
    object.userId = core.user?.id;

    return object;
  }

  /**
   * Mounts the object to a DOM element. Only executes once; subsequent calls are ignored.
   * Sets the element reference and marks the object as mounted.
   * @param element - The DOM element to mount this object to
   */
  mount(element: T): void {
    if (this.isMounted) {
      return;
    }

    this.elementRef = element;
    this.isMounted = true;
  }

  /**
   * Generates a unique identifier for the object.
   * @returns A UUID string
   */
  generateId(): string {
    return ObjectHelper.generateUUID();
  }

  /**
   * Checks whether the object is currently visible within the viewport.
   * Objects smaller than 0.5 square pixels (when scaled) are considered invisible.
   * Uses the rotated bounding box for accurate intersection testing.
   * @returns True if the object intersects with the visible viewport area
   */
  isInViewport(): boolean {

    const viewportScale = this._core.store.state.scale;
    const scaledWidth = this.boundingBox.width * viewportScale;
    const scaledHeight = this.boundingBox.height * viewportScale;
    
    if(scaledWidth * scaledHeight < 0.5){
      return false;
    }


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

  /**
   * Moves the object to the center of the current viewport.
   * Calculates the offset needed to align the object's center with the viewport's center.
   */
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

  /**
   * Notifies the store that this object has been updated.
   * Triggers a re-render of the object in the canvas.
   */
  update(): void {
    this._core.store.objects.update(this);
  }

  /**
   * Moves the object based on the delta between start and end coordinates.
   * The movement is scaled according to the current viewport scale.
   * @param startX - The starting X coordinate in screen space
   * @param startY - The starting Y coordinate in screen space
   * @param endX - The ending X coordinate in screen space
   * @param endY - The ending Y coordinate in screen space
   */
  move(startX: number, startY: number, endX: number, endY: number): void {
    const deltaX = (startX - endX) / this._core.store.state.scale;
    const deltaY = (startY - endY) / this._core.store.state.scale;

    this.translateX += deltaX;
    this.translateY += deltaY;

    this._core.store.objects.update(this);
  }

  /**
   * Resizes the object to new dimensions and position.
   * Ignores resize requests that would make the object smaller than 1x1 pixels.
   * Also updates any lines anchored to this object after resizing.
   * @param x - The new X position (translateX)
   * @param y - The new Y position (translateY)
   * @param width - The new width (must be > 1)
   * @param height - The new height (must be > 1)
   */
  resize(x: number, y: number, width: number, height: number): void {
    if (width <= 1 || height <= 1) {
      return;
    }

    this.width = width;
    this.height = height;
    this.translateX = x;
    this.translateY = y;

    this._core.store.objects.update(this);

    // Update any lines that are anchored to this object (after position is updated)
    this._core.anchorManager.updateAnchorsForObject(this.id);
  }

  /**
   * Sets the rotation angle of the object.
   * @param value - The rotation angle in radians
   */
  rotate(value: number): void {
    this.rotation = value;

    this._core.store.objects.update(this);
  }

  /**
   * Creates a shallow clone of this object with the same ID.
   * The clone shares the same prototype and copies all properties.
   * @returns A new instance with identical properties including the same ID
   */
  clone(): KritzelBaseObject<T> {
    const clone = Object.create(Object.getPrototypeOf(this));
    Object.assign(clone, this);
    clone.id = this.id;
    return clone;
  }

  /**
   * Creates a copy of this object with a new unique ID.
   * Unlike clone(), this creates an independent object suitable for duplication.
   * The copied object is not mounted by default.
   * @returns A new instance with copied properties and a new unique ID
   */
  copy(): KritzelBaseObject<T> {
    const copiedObject: KritzelBaseObject<T> = Object.create(Object.getPrototypeOf(this));
    Object.assign(copiedObject, this);
    copiedObject.id = this.generateId();
    copiedObject.isMounted = false;
    copiedObject.isSelected = false;
    copiedObject.isHovered = false;
    copiedObject.isInteractive = false;
    copiedObject.resizing = false;
    copiedObject.markedForRemoval = false;
    copiedObject.isVisible = true;
    return copiedObject;
  }

  /**
   * Serializes the object to a plain JavaScript object for persistence.
   * Excludes internal references (_core, _elementRef) and computed properties.
   * Subclasses should override to handle domain-specific serialization (e.g., HTML elements).
   * @returns A serializable object containing all persistent properties
   */
  serialize() {
    const {
      _core,
      _elementRef,
      element,
      totalWidth,
      totalHeight,
      isSelected,
      isHovered,
      isMounted,
      isInteractive,
      resizing,
      markedForRemoval,
      isVisible,
      ...remainingProps
    } = this as any;
    // No longer clone raw elements—let subclasses handle serializable payloads
    return structuredClone(remainingProps);
  }

  /**
   * Restores the object's state from a serialized plain object.
   * Merges all properties from the input object into this instance.
   * @template T - The expected return type
   * @param object - The serialized object data to restore from
   * @returns This instance cast to type T
   */
  deserialize<T>(object: any): T {
    Object.assign(this, object);
    // Selection/interactivity state is transient UI state and must not survive revival.
    this.isSelected = false;
    this.isHovered = false;
    this.isMounted = false;
    this.isInteractive = false;
    this.resizing = false;
    this.markedForRemoval = false;
    this.isVisible = true;
    // Reset known transient geometry caches if present on subclasses.
    if ('_adjustedPoints' in this) {
      (this as unknown as { _adjustedPoints: number[][] | null })._adjustedPoints = null;
    }
    if ('_clipInfo' in this) {
      (this as unknown as { _clipInfo: any })._clipInfo = null;
    }
    return this as unknown as T;
  }

  /**
   * Copies transient (non-persisted) state from a previous local instance
   * onto this freshly-revived instance. Called when a remote Yjs update
   * replaces an existing object so that local-only fields (e.g. asset
   * load state, resolved blob URLs) survive across remote position
   * updates and don't visually flicker.
   *
   * Default implementation is a no-op; subclasses with transient fields
   * should override.
   * @param previous - The previous local instance being replaced.
   */
  adoptTransientStateFrom(_previous: KritzelBaseObject<any>): void {
    // no-op by default
  }

  /**
   * Type guard to check if this object is of a specific class type.
   * Compares against the __class__ property.
   * @template T - The expected class type extending KritzelBaseObject
   * @param className - The class name to check against
   * @returns True if this object's __class__ matches the given class name
   */
  isClass<T extends KritzelBaseObject>(this: T, className: string): this is T {
    return this.__class__ === className;
  }

  /**
   * Handles edit actions on the object. Override in subclasses to implement
   * custom edit behavior (e.g., entering text edit mode).
   * @param _event - Optional pointer event that triggered the edit
   */
  edit(_event?: PointerEvent): void {
    // This method can be overridden by subclasses to handle edit actions.
  }

  /**
   * Lifecycle hook called after properties are updated via updateObject.
   * Override in subclasses to perform custom logic when specific properties change.
   * @param _changedProperties - Array of property names that were changed
   */
  onAfterUpdate(_changedProperties: string[]): void {
    // Default implementation does nothing
  }

  /**
   * Tests if a point intersects with this object.
   * Override in subclasses for precise hit detection (e.g., path-based objects).
   * @param _x - The X coordinate to test in world space
   * @param _y - The Y coordinate to test in world space
   * @returns True if the point hits the object (default always returns true)
   */
  hitTest(_x: number, _y: number): boolean {
    return true; // Default implementation, can be overridden by subclasses
  }

  /**
   * Tests if this object's rotated polygon intersects with another polygon.
   * Useful for lasso selection and collision detection.
   * @param polygon - The polygon to test intersection against
   * @returns True if the polygons intersect
   */
  hitTestPolygon(polygon: KritzelPolygon): boolean {
    const objectPolygon = this.rotatedPolygon;
    return KritzelGeometryHelper.doPolygonsIntersect(objectPolygon, polygon);
  }

  /**
   * Updates the object's position and notifies the store.
   * @param x - The new X position (translateX)
   * @param y - The new Y position (translateY)
   */
  updatePosition(x: number, y: number): void {
    this.translateX = x;
    this.translateY = y;
    this._core.store.objects.update(this);
  }
}
