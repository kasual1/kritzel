import { g as getDefaultExportFromCjs } from './_commonjsHelpers-i-KAFXlR.js';

class ObjectHelper {
    static generateUUID(length = 16) {
        const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const bytes = crypto.getRandomValues(new Uint8Array(length));
        return Array.from(bytes)
            .map(byte => alphabet[byte % alphabet.length])
            .join('');
    }
    static isEmpty(obj) {
        if (obj === null || obj === undefined) {
            return true;
        }
        return Object?.keys(obj).length === 0 && obj?.constructor === Object;
    }
    static isClass(object, className) {
        return !!object && object.__class__ === className;
    }
    static isKritzelEmbeddedObject(object) {
        if (!object || typeof object !== 'object') {
            return false;
        }
        const candidate = object;
        return (typeof candidate.isInteractive === 'boolean' &&
            typeof candidate.isSelected === 'boolean' &&
            typeof candidate.mount === 'function' &&
            typeof candidate.unmount === 'function' &&
            typeof candidate.setIsInteractive === 'function' &&
            typeof candidate.hasFocusedInputElement === 'function' &&
            typeof candidate.getEmbeddedContentRoots === 'function');
    }
    static isKritzelExportable(object) {
        if (!object || typeof object !== 'object') {
            return false;
        }
        const candidate = object;
        if (typeof candidate.getSupportedExportFormats !== 'function' || typeof candidate.exportAs !== 'function') {
            return false;
        }
        const formats = candidate.getSupportedExportFormats();
        return Array.isArray(formats) && formats.length > 0;
    }
}

class KritzelGeometryHelper {
    static doPolygonsIntersect(polygon1, polygon2) {
        // 1. Convert polygons to array of points for easier processing
        const points1 = [polygon1.bottomLeft, polygon1.bottomRight, polygon1.topRight, polygon1.topLeft];
        const points2 = [polygon2.bottomLeft, polygon2.bottomRight, polygon2.topRight, polygon2.topLeft];
        // 2. Check if any point of polygon1 is inside polygon2
        for (const point of points1) {
            if (this.isPointInPolygon(point, points2)) {
                return true;
            }
        }
        // 3. Check if any point of polygon2 is inside polygon1
        for (const point of points2) {
            if (this.isPointInPolygon(point, points1)) {
                return true;
            }
        }
        // 4. Check for edge intersections (more complex)
        for (let i = 0; i < points1.length; i++) {
            const p1a = points1[i];
            const p1b = points1[(i + 1) % points1.length]; // Wrap around to the first point
            for (let j = 0; j < points2.length; j++) {
                const p2a = points2[j];
                const p2b = points2[(j + 1) % points2.length];
                if (this.intersectLines(p1a, p1b, p2a, p2b)) {
                    return true;
                }
            }
        }
        return false; // No intersection found
    }
    static isPointInPolygon(point, polygon) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;
            const intersect = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
            if (intersect)
                inside = !inside;
        }
        return inside;
    }
    static intersectLines(p1a, p1b, p2a, p2b) {
        const det = (p1b.x - p1a.x) * (p2b.y - p2a.y) - (p1b.y - p1a.y) * (p2b.x - p2a.x);
        if (det === 0) {
            return false; // Lines are parallel
        }
        const t = ((p2a.x - p1a.x) * (p2b.y - p2a.y) - (p2a.y - p1a.y) * (p2b.x - p2a.x)) / det;
        const u = -((p1a.x - p2a.x) * (p1b.y - p1a.y) - (p1a.y - p2a.y) * (p1b.x - p1a.x)) / det;
        return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    }
    /**
     * Finds the intersection point between a line segment and a line segment.
     * Returns the intersection point or null if no intersection.
     */
    static getLineIntersectionPoint(p1a, p1b, p2a, p2b) {
        const det = (p1b.x - p1a.x) * (p2b.y - p2a.y) - (p1b.y - p1a.y) * (p2b.x - p2a.x);
        if (det === 0) {
            return null; // Lines are parallel
        }
        const t = ((p2a.x - p1a.x) * (p2b.y - p2a.y) - (p2a.y - p1a.y) * (p2b.x - p2a.x)) / det;
        const u = -((p1a.x - p2a.x) * (p1b.y - p1a.y) - (p1a.y - p2a.y) * (p1b.x - p1a.x)) / det;
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return {
                x: p1a.x + t * (p1b.x - p1a.x),
                y: p1a.y + t * (p1b.y - p1a.y)
            };
        }
        return null;
    }
    /**
     * Finds the closest intersection point between a line segment (from lineStart to lineEnd)
     * and a polygon. Returns the intersection point closest to lineStart, or null if no intersection.
     */
    static getLinePolygonIntersection(lineStart, lineEnd, polygon) {
        const points = [polygon.topLeft, polygon.topRight, polygon.bottomRight, polygon.bottomLeft];
        let closestIntersection = null;
        let closestDistance = Infinity;
        for (let i = 0; i < points.length; i++) {
            const edgeStart = points[i];
            const edgeEnd = points[(i + 1) % points.length];
            const intersection = this.getLineIntersectionPoint(lineStart, lineEnd, edgeStart, edgeEnd);
            if (intersection) {
                const distance = Math.sqrt(Math.pow(intersection.x - lineStart.x, 2) +
                    Math.pow(intersection.y - lineStart.y, 2));
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestIntersection = intersection;
                }
            }
        }
        return closestIntersection;
    }
    /**
     * Generates a polygon approximation of an ellipse.
     * @param centerX - X coordinate of ellipse center
     * @param centerY - Y coordinate of ellipse center
     * @param rx - Horizontal radius
     * @param ry - Vertical radius
     * @param segments - Number of segments (more = smoother approximation)
     * @param rotation - Optional rotation angle in radians
     */
    static getEllipsePolygonApproximation(centerX, centerY, rx, ry, segments = 32, rotation = 0) {
        const points = [];
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        for (let i = 0; i < segments; i++) {
            const angle = (2 * Math.PI * i) / segments;
            // Point on unrotated ellipse
            const px = rx * Math.cos(angle);
            const py = ry * Math.sin(angle);
            // Apply rotation around center
            const rotatedX = centerX + px * cos - py * sin;
            const rotatedY = centerY + px * sin + py * cos;
            points.push({ x: rotatedX, y: rotatedY });
        }
        return points;
    }
    /**
     * Finds the closest intersection point between a line segment and a polygon
     * defined as an array of points. Returns the intersection closest to lineStart,
     * or null if no intersection.
     */
    static getLinePointsArrayIntersection(lineStart, lineEnd, polygonPoints) {
        let closestIntersection = null;
        let closestDistance = Infinity;
        for (let i = 0; i < polygonPoints.length; i++) {
            const edgeStart = polygonPoints[i];
            const edgeEnd = polygonPoints[(i + 1) % polygonPoints.length];
            const intersection = this.getLineIntersectionPoint(lineStart, lineEnd, edgeStart, edgeEnd);
            if (intersection) {
                const distance = Math.sqrt(Math.pow(intersection.x - lineStart.x, 2) +
                    Math.pow(intersection.y - lineStart.y, 2));
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestIntersection = intersection;
                }
            }
        }
        return closestIntersection;
    }
    /**
     * Checks if a point is inside a polygon defined as an array of points.
     * This is a convenience wrapper that works with arbitrary polygon point arrays.
     */
    static isPointInPolygonPoints(point, polygonPoints) {
        return this.isPointInPolygon(point, polygonPoints);
    }
}

/**
 * Base class for all objects that can be rendered on the Kritzel canvas.
 * Provides common functionality for positioning, transformation, hit testing,
 * serialization, and lifecycle management.
 * @template T - The type of the underlying DOM element (HTMLElement or SVGElement)
 */
class KritzelBaseObject {
    __class__ = 'KritzelBaseObject';
    _core;
    _elementRef;
    id;
    workspaceId;
    x;
    y;
    translateX;
    translateY;
    height;
    width;
    backgroundColor;
    borderColor;
    borderWidth = 0;
    opacity = 1;
    padding = 0;
    scale;
    resizing = false;
    rotation = 0;
    markedForRemoval = false;
    zIndex = 0;
    userId;
    isVisible = true;
    isSelected = false;
    isHovered = false;
    isMounted = false;
    isEditable = false;
    isInteractive = false;
    isResizable = true;
    isRotatable = true;
    /**
     * Gets the total width of the object including padding.
     * @returns The width plus double the padding value
     */
    get totalWidth() {
        return this.width + this.padding * 2;
    }
    /**
     * Gets the total height of the object including padding.
     * @returns The height plus double the padding value
     */
    get totalHeight() {
        return this.height + this.padding * 2;
    }
    /**
     * Sets the underlying DOM element reference for this object.
     * @param element - The DOM element to associate with this object
     */
    set elementRef(element) {
        this._elementRef = element;
    }
    /**
     * Gets the underlying DOM element reference for this object.
     * @returns The associated DOM element
     */
    get elementRef() {
        return this._elementRef;
    }
    /**
     * Gets the axis-aligned bounding box of the object without rotation.
     * @returns The bounding box with position, scale, and dimensions
     */
    get boundingBox() {
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
    get rotatedBoundingBox() {
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
    get rotatedPolygon() {
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
        const rotate = (x, y) => ({
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
    get minXRotated() {
        const corners = [this.rotatedPolygon.topLeft.x, this.rotatedPolygon.topRight.x, this.rotatedPolygon.bottomRight.x, this.rotatedPolygon.bottomLeft.x];
        return Math.min(...corners);
    }
    /**
     * Gets the minimum Y coordinate among all rotated corners.
     * @returns The topmost Y coordinate of the rotated object
     */
    get minYRotated() {
        const corners = [this.rotatedPolygon.topLeft.y, this.rotatedPolygon.topRight.y, this.rotatedPolygon.bottomRight.y, this.rotatedPolygon.bottomLeft.y];
        return Math.min(...corners);
    }
    /**
     * Gets the maximum X coordinate among all rotated corners.
     * @returns The rightmost X coordinate of the rotated object
     */
    get maxXRotated() {
        const corners = [this.rotatedPolygon.topLeft.x, this.rotatedPolygon.topRight.x, this.rotatedPolygon.bottomRight.x, this.rotatedPolygon.bottomLeft.x];
        return Math.max(...corners);
    }
    /**
     * Gets the maximum Y coordinate among all rotated corners.
     * @returns The bottommost Y coordinate of the rotated object
     */
    get maxYRotated() {
        const corners = [this.rotatedPolygon.topLeft.y, this.rotatedPolygon.topRight.y, this.rotatedPolygon.bottomRight.y, this.rotatedPolygon.bottomLeft.y];
        return Math.max(...corners);
    }
    /**
     * Gets the CSS transformation matrix string for positioning and scaling.
     * @returns A CSS matrix() function string combining scale and translation
     */
    get transformationMatrix() {
        const scale = 1 / this.scale;
        const translateX = this.translateX;
        const translateY = this.translateY;
        return `matrix(${scale}, 0, 0, ${scale}, ${translateX}, ${translateY})`;
    }
    /**
     * Gets the rotation angle converted from radians to degrees.
     * @returns The rotation angle in degrees
     */
    get rotationDegrees() {
        return this.rotation * (180 / Math.PI);
    }
    /**
     * Gets the X coordinate of the object's center point.
     * @returns The center X position in world coordinates
     */
    get centerX() {
        return this.translateX + this.totalWidth / 2 / this.scale;
    }
    /**
     * Gets the Y coordinate of the object's center point.
     * @returns The center Y position in world coordinates
     */
    get centerY() {
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
    static create(core) {
        const object = new KritzelBaseObject();
        object._core = core;
        object.zIndex = core.store.currentZIndex;
        object.workspaceId = core.store.state.activeWorkspace.id;
        object.userId = core.user?.id;
        return object;
    }
    /**
     * Mounts the object to a DOM element. Only executes once; subsequent calls are ignored.
     * Sets the element reference and marks the object as mounted.
     * @param element - The DOM element to mount this object to
     */
    mount(element) {
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
    generateId() {
        return ObjectHelper.generateUUID();
    }
    /**
     * Checks whether the object is currently visible within the viewport.
     * Objects smaller than 0.5 square pixels (when scaled) are considered invisible.
     * Uses the rotated bounding box for accurate intersection testing.
     * @returns True if the object intersects with the visible viewport area
     */
    isInViewport() {
        const viewportScale = this._core.store.state.scale;
        const scaledWidth = this.boundingBox.width * viewportScale;
        const scaledHeight = this.boundingBox.height * viewportScale;
        if (scaledWidth * scaledHeight < 0.5) {
            return false;
        }
        const viewportBounds = {
            x: -this._core.store.state.translateX / this._core.store.state.scale,
            y: -this._core.store.state.translateY / this._core.store.state.scale,
            z: this._core.store.state.scale,
            width: this._core.store.state.viewportWidth / this._core.store.state.scale,
            height: this._core.store.state.viewportHeight / this._core.store.state.scale,
        };
        return (this.rotatedBoundingBox.x < viewportBounds.x + viewportBounds.width &&
            this.rotatedBoundingBox.x + this.rotatedBoundingBox.width > viewportBounds.x &&
            this.rotatedBoundingBox.y < viewportBounds.y + viewportBounds.height &&
            this.rotatedBoundingBox.y + this.rotatedBoundingBox.height > viewportBounds.y);
    }
    /**
     * Moves the object to the center of the current viewport.
     * Calculates the offset needed to align the object's center with the viewport's center.
     */
    centerInViewport() {
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
    update() {
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
    move(startX, startY, endX, endY) {
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
    resize(x, y, width, height) {
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
    rotate(value) {
        this.rotation = value;
        this._core.store.objects.update(this);
    }
    /**
     * Creates a shallow clone of this object with the same ID.
     * The clone shares the same prototype and copies all properties.
     * @returns A new instance with identical properties including the same ID
     */
    clone() {
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
    copy() {
        const copiedObject = Object.create(Object.getPrototypeOf(this));
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
        const { _core, _elementRef, element, totalWidth, totalHeight, isSelected, isHovered, isMounted, isInteractive, resizing, markedForRemoval, isVisible, ...remainingProps } = this;
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
    deserialize(object) {
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
            this._adjustedPoints = null;
        }
        if ('_clipInfo' in this) {
            this._clipInfo = null;
        }
        return this;
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
    adoptTransientStateFrom(_previous) {
        // no-op by default
    }
    /**
     * Type guard to check if this object is of a specific class type.
     * Compares against the __class__ property.
     * @template T - The expected class type extending KritzelBaseObject
     * @param className - The class name to check against
     * @returns True if this object's __class__ matches the given class name
     */
    isClass(className) {
        return this.__class__ === className;
    }
    /**
     * Handles edit actions on the object. Override in subclasses to implement
     * custom edit behavior (e.g., entering text edit mode).
     * @param _event - Optional pointer event that triggered the edit
     */
    edit(_event) {
        // This method can be overridden by subclasses to handle edit actions.
    }
    /**
     * Lifecycle hook called after properties are updated via updateObject.
     * Override in subclasses to perform custom logic when specific properties change.
     * @param _changedProperties - Array of property names that were changed
     */
    onAfterUpdate(_changedProperties) {
        // Default implementation does nothing
    }
    /**
     * Tests if a point intersects with this object.
     * Override in subclasses for precise hit detection (e.g., path-based objects).
     * @param _x - The X coordinate to test in world space
     * @param _y - The Y coordinate to test in world space
     * @returns True if the point hits the object (default always returns true)
     */
    hitTest(_x, _y) {
        return true; // Default implementation, can be overridden by subclasses
    }
    /**
     * Tests if this object's rotated polygon intersects with another polygon.
     * Useful for lasso selection and collision detection.
     * @param polygon - The polygon to test intersection against
     * @returns True if the polygons intersect
     */
    hitTestPolygon(polygon) {
        const objectPolygon = this.rotatedPolygon;
        return KritzelGeometryHelper.doPolygonsIntersect(objectPolygon, polygon);
    }
    /**
     * Updates the object's position and notifies the store.
     * @param x - The new X position (translateX)
     * @param y - The new Y position (translateY)
     */
    updatePosition(x, y) {
        this.translateX = x;
        this.translateY = y;
        this._core.store.objects.update(this);
    }
}

/**
 * Helper function to resolve a color value for a specific theme
 */
function resolveColor(color, theme) {
    if (theme in color && color[theme]) {
        return color[theme];
    }
    return color[theme === 'dark' ? 'dark' : 'light'];
}
/**
 * Default color palette shared across all tool configurations.
 * This ensures consistency in color options throughout the application.
 * All colors support theme-specific variations.
 */
const DEFAULT_COLOR_PALETTE = [
    { light: '#000000', dark: '#ffffff', label: 'Primary' },
    { light: '#ff5252', dark: '#ff5252' },
    { light: '#ffbc00', dark: '#ffbc00' },
    { light: '#00c853', dark: '#00c853' },
    { light: '#0000FF', dark: '#0000FF' },
    { light: '#d500f9', dark: '#d500f9' },
    { light: '#fafafa', dark: '#212121', label: 'Background' },
    { light: '#a52714', dark: '#a52714' },
    { light: '#ee8100', dark: '#ee8100' },
    { light: '#558b2f', dark: '#558b2f' },
    { light: '#01579b', dark: '#01579b' },
    { light: '#8e24aa', dark: '#8e24aa' },
    { light: '#90a4ae', dark: '#607d8b', label: 'Neutral' },
    { light: '#ff4081', dark: '#ff4081' },
    { light: '#ff6e40', dark: '#ff6e40' },
    { light: '#aeea00', dark: '#aeea00' },
    { light: '#304ffe', dark: '#304ffe' },
    { light: '#7c4dff', dark: '#7c4dff' },
    { light: '#cfd8dc', dark: '#455a64' },
    { light: '#f8bbd0', dark: '#ec407a' },
    { light: '#ffccbc', dark: '#ff7043' },
    { light: '#f0f4c3', dark: '#c0ca33' },
    { light: '#9fa8da', dark: '#5c6bc0' },
    { light: '#d1c4e9', dark: '#9575cd' },
];

/**
 * Light theme preset - the default theme
 */
const lightTheme = {
    name: 'light',
    global: {
        borderColor: '#ebebeb',
        dividerColor: '#e0e0e0',
        focusColor: '#333333',
        focusRingColor: '#333333',
        fontFamily: 'sans-serif',
        iconColor: 'currentColor',
        scrollbarThumbColor: '#ebebeb',
        textPrimary: '#000000',
        textSecondary: '#333333',
    },
    pillTabs: {
        background: '#f0f0f0',
        tabBackground: 'transparent',
        tabBackgroundHover: 'rgba(0, 0, 0, 0.05)',
        tabBackgroundSelected: '#ffffff',
        tabLabelMaxWidth: '10rem',
        tabShadowSelected: '0 1px 3px rgba(0, 0, 0, 0.1)',
        tabTextColor: '#666666',
        tabTextColorSelected: '#000000',
    },
    textInput: {
        background: '#ffffff',
        borderColor: '#dbdbdb',
        borderRadius: '6px',
        focusBorderColor: '#333333',
        hoverBorderColor: '#cccccc',
        labelColor: '#333333',
        placeholderColor: '#999999',
        selectionBackground: '#007AFF',
        selectionColor: '#ffffff',
        suffixBackground: '#f5f5f5',
        suffixColor: '#666666',
        textColor: '#333333',
    },
    selection: {
        borderColor: '#007AFF',
        boxBackgroundColor: 'rgba(0, 122, 255, 0.2)',
        boxBorderColor: 'rgba(0, 122, 255, 0.5)',
        handleColor: '#ffffff',
        handleStrokeColor: '#007AFF'
    },
    checkerboard: {
        colorDark: '#cccccc',
        colorLight: '#ffffff',
    },
    backToContent: {
        activeBackgroundColor: 'hsl(0, 0%, 0%, 8.6%)',
        backgroundColor: '#ffffff',
        border: '1px solid #ebebeb',
        boxShadow: '0 0 3px rgba(0, 0, 0, 0.08)',
        color: '#000000',
        hoverBackgroundColor: 'hsl(0, 0%, 0%, 4.3%)',
    },
    colorPalette: {
        circleBorderColor: '#dddcdc',
        hoverBackgroundColor: '#ebebeb',
        selectedBackgroundColor: '#ebebeb',
    },
    contextMenu: {
        backgroundColor: '#ffffff',
        border: '1px solid #ebebeb',
        boxShadow: '0 1px 6px rgba(0, 0, 0, 0.12)',
        dividerColor: 'rgba(0, 0, 0, 0.1)',
        itemActiveBackgroundColor: 'hsl(0, 0%, 0%, 8.6%)',
        itemColor: '#333333',
        itemDisabledColor: '#aaaaaa',
        itemHoverBackgroundColor: 'hsl(0, 0%, 0%, 4.3%)',
    },
    toolbar: {
        backgroundColor: '#ffffff',
        border: '1px solid #ebebeb',
        boxShadow: '0 0 3px rgba(0, 0, 0, 0.08)',
        controlActiveBackgroundColor: 'hsl(0, 0%, 0%, 8.6%)',
        controlColor: '#000000',
        controlHoverBackgroundColor: 'hsl(0, 0%, 0%, 4.3%)',
        controlSelectedBackgroundColor: '#007AFF',
        controlSelectedColor: '#ffffff',
        separatorColor: '#ebebeb',
    },
    currentUserDialog: {
        emailColor: '#666666',
        nameColor: '#333333',
    },
    dialog: {
        backdropColor: 'rgba(0, 0, 0, 0.4)',
        backgroundColor: '#ffffff',
        border: '1px solid #ebebeb',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
        closeButtonActiveBackground: 'hsl(0, 0%, 0%, 8.6%)',
        closeButtonBackground: 'transparent',
        closeButtonColor: '#333333',
        closeButtonHoverBackground: 'hsl(0, 0%, 0%, 4.3%)',
        closeButtonHoverColor: '#000000',
        footerBorder: '1px solid #ebebeb',
        headerBorder: '1px solid #ebebeb',
        titleColor: '#000000',
    },
    loginDialog: {
        buttonActiveBackground: '#ebebeb',
        buttonBackground: '#ffffff',
        buttonBorderColor: '#e0e0e0',
        buttonHoverBackground: '#f5f5f5',
        buttonHoverBorderColor: '#cccccc',
        buttonTextColor: '#333333',
        spinnerActiveColor: '#333333',
        spinnerColor: '#cccccc',
        subtitleColor: '#666666',
    },
    dropdown: {
        accentColor: '#007bff',
        background: '#ffffff',
        borderColor: '#dbdbdb',
        borderRadius: '6px',
        hoverBorderColor: '#cccccc',
        hoverBackgroundColor: '#f0f0f0',
        menuBorderRadius: '6px',
        selectedBackgroundColor: '#007bff1a',
        textColor: '#333333',
    },
    engine: {
        backgroundColor: '#ffffff',
    },
    editor: {
        loadingOverlayBackground: 'rgba(255, 255, 255, 0.85)',
        loadingOverlayColor: '#333333',
        loadingOverlaySpinnerActiveColor: '#333333',
        loadingOverlaySpinnerColor: '#cccccc',
    },
    snap: {
        indicatorFill: 'rgba(59, 130, 246, 0.3)',
        indicatorFillInactive: 'rgba(59, 130, 246, 0.18)',
        indicatorStroke: '#007bff',
        indicatorStrokeInactive: 'rgba(59, 130, 246, 0.5)',
        lineStroke: 'rgba(0, 0, 0, 0.2)',
    },
    fontSize: {
        hoverBackgroundColor: '#ebebeb',
        selectedBackgroundColor: '#ebebeb',
        textColor: '#333333',
    },
    lineEndings: {
        hoverBackgroundColor: '#ebebeb',
        labelColor: '#666666',
        optionBackground: '#ffffff',
        selectedBackgroundColor: '#ebebeb',
    },
    masterDetail: {
        backButtonColor: '#333333',
        backgroundColor: '#ffffff',
        detailBackgroundColor: '#ffffff',
        detailFocusOutline: '2px solid #333333',
        menuBackgroundColor: '#ffffff',
        menuBorderRight: '1px solid #ebebeb',
        menuItemActiveBackgroundColor: 'hsl(0, 0%, 0%, 8.6%)',
        menuItemBackgroundColor: 'transparent',
        menuItemChevronColor: '#aaaaaa',
        menuItemColor: '#333333',
        menuItemDisabledColor: '#aaaaaa',
        menuItemFocusOutline: '2px solid #333333',
        menuItemHoverBackgroundColor: 'hsl(0, 0%, 0%, 4.3%)',
        menuItemSelectedBackgroundColor: '#007AFF',
        menuItemSelectedColor: '#ffffff',
        menuItemSelectedHoverBackgroundColor: '#007AFF',
    },
    menu: {
        backgroundColor: '#ffffff',
        border: '1px solid #ebebeb',
        boxShadow: '0 0 3px rgba(0, 0, 0, 0.08)',
        itemButtonHoverBackgroundColor: 'hsl(0, 0%, 0%, 4.3%)',
        itemChildOpenBackgroundColor: 'hsl(0, 0%, 0%, 3%)',
        itemColor: '#333333',
        itemEditingBackgroundColor: '#f0f0f0',
        itemInputBorder: '1px solid #333333',
        itemInputBorderColorOnSelected: '#ffffff',
        itemInputCaretColor: '#333333',
        itemInputCaretColorOnSelected: '#ffffff',
        itemInputSelectionColor: '#007aff',
        itemInputSelectionColorOnSelected: 'rgba(255, 255, 255, 0.55)',
        itemInputSelectionTextColor: '#ffffff',
        itemInputSelectionTextColorOnSelected: '#ffffff',
        itemOverlayBackgroundColor: 'hsl(0, 0%, 0%, 4.3%)',
        itemSelectedBackgroundColor: '#007aff',
        itemSelectedColor: '#ffffff',
    },
    moreMenu: {
        backgroundColor: '#ffffff',
        border: '1px solid #ebebeb',
        borderRadius: '12px',
        boxShadow: '0 0 3px rgba(0, 0, 0, 0.08)',
        buttonActiveBackgroundColor: 'hsl(0, 0%, 0%, 8.6%)',
        buttonColor: '#000000',
        buttonHoverBackgroundColor: 'hsl(0, 0%, 0%, 4.3%)',
        innerBorderRadius: '12px',
    },
    notificationCard: {
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)',
        color: '#111827',
        dismissButtonActiveBackgroundColor: '#e5e7eb',
        dismissButtonBackgroundColor: 'transparent',
        dismissButtonBorderRadius: '6px',
        dismissButtonColor: '#4b5563',
        dismissButtonHoverBackgroundColor: '#f3f4f6',
        dismissButtonSize: '24px',
        errorPillBackgroundColor: '#fef2f2',
        errorPillColor: '#b91c1c',
        headerGap: '8px',
        headerMarginBottom: '8px',
        headerRightGap: '6px',
        infoPillBackgroundColor: '#eff6ff',
        infoPillColor: '#1d4ed8',
        maxWidth: '360px',
        messageColor: 'inherit',
        messageFontSize: '14px',
        messageLineHeight: '1.45',
        padding: '12px 14px',
        pillBackgroundColor: '#eff6ff',
        pillBorderRadius: '999px',
        pillColor: '#1d4ed8',
        pillFontSize: '12px',
        pillFontWeight: '600',
        pillHeight: '22px',
        pillPadding: '0 8px',
        timestampColor: '#6b7280',
        timestampFontSize: '12px',
        warningPillBackgroundColor: '#fff7ed',
        warningPillColor: '#b45309',
    },
    numericInput: {
        focusBorderColor: '#333333',
        borderColor: '#dbdbdb',
        borderRadius: '6px',
        hoverBorderColor: '#cccccc',
        inputBackground: '#ffffff',
        labelColor: '#666666',
        selectionBackground: '#007AFF',
        selectionColor: '#ffffff',
        spinnerActiveBackground: 'hsl(0, 0%, 0%, 8.6%)',
        spinnerBackground: 'transparent',
        spinnerBorderRadius: '5px',
        spinnerColor: '#333333',
        spinnerHoverBackground: 'hsl(0, 0%, 0%, 4.3%)',
        textColor: '#333333',
    },
    opacitySlider: {
        activeColor: '#007AFF',
        thumbBorderColor: '#007AFF',
        thumbColor: '#ffffff',
        trackColor: '#e0e0e0',
    },
    settings: {
        contentHeadingColor: '#000000',
        contentTextColor: '#333333',
        descriptionColor: '#666666',
        labelColor: '#333333',
        shortcutItemBg: '#f8f8f8',
        shortcutKeyBg: '#ffffff',
        shortcutKeyBorder: '#e0e0e0',
        shortcutKeyColor: '#555555',
    },
    shapeFill: {
        hoverBackgroundColor: '#ebebeb',
        optionBackground: '#ffffff',
        selectedBackgroundColor: '#ebebeb',
    },
    shareDialog: {
        borderColor: '#e5e5e5',
        copyButtonBackground: '#ffffff',
        copyButtonColor: '#666666',
        copyButtonHoverBackground: '#e8e8e8',
        copyButtonHoverColor: '#333333',
        copySuccessBackground: '#d4edda',
        copySuccessColor: '#28a745',
        descriptionColor: '#666666',
        inputBackground: '#f5f5f5',
        inputBorderColor: '#e0e0e0',
        inputTextColor: '#333333',
        labelColor: '#333333',
        revokeButtonBorderColor: '#dc3545',
        revokeButtonColor: '#dc3545',
        revokeButtonHoverBackground: '#dc3545',
        revokeButtonHoverColor: '#ffffff',
        selectionColor: '#cce5ff',
    },
    slideToggle: {
        thumbColor: '#fff',
        thumbSize: '18px',
        trackCheckedColor: '#007AFF',
        trackColor: '#ccc',
    },
    splitButton: {
        backgroundColor: '#ffffff',
        border: '1px solid #ebebeb',
        boxShadow: '0 0 3px rgba(0, 0, 0, 0.08)',
        color: '#000000',
        dividerBackgroundColor: '#ebebeb',
        hoverBackgroundColor: 'hsl(0, 0%, 0%, 4.3%)',
    },
    strokeSize: {
        hoverBackgroundColor: '#ebebeb',
        selectedBackgroundColor: '#ebebeb',
    },
    tooltip: {
        backgroundColor: '#ffffff',
        border: '1px solid #ebebeb',
        boxShadow: '0 1px 6px rgba(0, 0, 0, 0.12)',
        color: '#000000',
    },
    utilityPanel: {
        backgroundColor: '#e2e2e2',
        buttonColor: '#333333',
        buttonHoverBackgroundColor: 'hsl(0, 0%, 0%, 4.3%)',
        separatorColor: 'hsl(0, 0%, 0%, 8%)',
    },
    watermark: {
        background: 'rgba(255, 255, 255, 0.6)',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.12)',
        color: 'rgba(60, 60, 60, 0.75)',
    },
    zoomPanel: {
        backgroundColor: '#ffffff',
        border: '1px solid #ebebeb',
        borderRadius: '12px',
        boxShadow: '0 0 3px rgba(0, 0, 0, 0.08)',
        buttonActiveBackgroundColor: 'hsl(0, 0%, 0%, 8.6%)',
        buttonBorderRadius: '8px',
        buttonHoverBackgroundColor: 'hsl(0, 0%, 0%, 4.3%)',
        buttonSize: '32px',
        gap: '4px',
        iconColor: '#000000',
        padding: '4px',
    },
};

/**
 * Dark theme preset
 */
const darkTheme = {
    name: 'dark',
    global: {
        borderColor: '#3a3a3a',
        dividerColor: '#3a3a3a',
        focusColor: '#ffffff',
        focusRingColor: '#ffffff',
        fontFamily: 'sans-serif',
        iconColor: 'currentColor',
        scrollbarThumbColor: '#555555',
        textPrimary: '#ffffff',
        textSecondary: '#e0e0e0',
    },
    pillTabs: {
        background: '#3a3a3a',
        tabBackground: 'transparent',
        tabBackgroundHover: 'rgba(255, 255, 255, 0.08)',
        tabBackgroundSelected: '#2a2a2a',
        tabLabelMaxWidth: '10rem',
        tabShadowSelected: '0 1px 3px rgba(0, 0, 0, 0.3)',
        tabTextColor: '#999999',
        tabTextColorSelected: '#ffffff',
    },
    textInput: {
        background: '#1a1a1a',
        borderColor: '#4a4a4a',
        borderRadius: '6px',
        focusBorderColor: '#ffffff',
        hoverBorderColor: '#5a5a5a',
        labelColor: '#e0e0e0',
        placeholderColor: '#777777',
        selectionBackground: '#0A84FF',
        selectionColor: '#ffffff',
        suffixBackground: '#3a3a3a',
        suffixColor: '#aaaaaa',
        textColor: '#e0e0e0',
    },
    selection: {
        borderColor: '#0A84FF',
        boxBackgroundColor: 'rgba(10, 132, 255, 0.2)',
        boxBorderColor: 'rgba(10, 132, 255, 0.5)',
        handleColor: '#1a1a1a',
        handleStrokeColor: '#0A84FF'
    },
    checkerboard: {
        colorDark: '#4a4a4a',
        colorLight: '#3a3a3a',
    },
    backToContent: {
        activeBackgroundColor: 'hsl(0, 0%, 100%, 12%)',
        backgroundColor: '#2a2a2a',
        border: '1px solid #3a3a3a',
        boxShadow: '0 0 6px rgba(0, 0, 0, 0.3)',
        color: '#ffffff',
        hoverBackgroundColor: 'hsl(0, 0%, 100%, 8%)',
    },
    colorPalette: {
        circleBorderColor: '#4a4a4a',
        hoverBackgroundColor: '#3a3a3a',
        selectedBackgroundColor: '#3a3a3a',
    },
    contextMenu: {
        backgroundColor: '#2a2a2a',
        border: '1px solid #3a3a3a',
        boxShadow: '0 1px 8px rgba(0, 0, 0, 0.4)',
        dividerColor: 'rgba(255, 255, 255, 0.1)',
        itemActiveBackgroundColor: 'hsl(0, 0%, 100%, 12%)',
        itemColor: '#e0e0e0',
        itemDisabledColor: '#666666',
        itemHoverBackgroundColor: 'hsl(0, 0%, 100%, 8%)',
    },
    toolbar: {
        backgroundColor: '#2a2a2a',
        border: '1px solid #3a3a3a',
        boxShadow: '0 0 6px rgba(0, 0, 0, 0.3)',
        controlActiveBackgroundColor: 'hsl(0, 0%, 100%, 12%)',
        controlColor: '#ffffff',
        controlHoverBackgroundColor: 'hsl(0, 0%, 100%, 8%)',
        controlSelectedBackgroundColor: '#0A84FF',
        controlSelectedColor: '#ffffff',
        separatorColor: '#3a3a3a',
    },
    currentUserDialog: {
        emailColor: '#999999',
        nameColor: '#ffffff',
    },
    dialog: {
        backdropColor: 'rgba(0, 0, 0, 0.6)',
        backgroundColor: '#2a2a2a',
        border: '1px solid #3a3a3a',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.5)',
        closeButtonActiveBackground: 'hsl(0, 0%, 100%, 12%)',
        closeButtonBackground: 'transparent',
        closeButtonColor: '#e0e0e0',
        closeButtonHoverBackground: 'hsl(0, 0%, 100%, 8%)',
        closeButtonHoverColor: '#ffffff',
        footerBorder: '1px solid #3a3a3a',
        headerBorder: '1px solid #3a3a3a',
        titleColor: '#ffffff',
    },
    loginDialog: {
        buttonActiveBackground: '#444444',
        buttonBackground: '#2a2a2a',
        buttonBorderColor: '#4a4a4a',
        buttonHoverBackground: '#3a3a3a',
        buttonHoverBorderColor: '#5a5a5a',
        buttonTextColor: '#e0e0e0',
        spinnerActiveColor: '#ffffff',
        spinnerColor: '#555555',
        subtitleColor: '#999999',
    },
    dropdown: {
        accentColor: '#0A84FF',
        borderColor: '#4a4a4a',
        borderRadius: '6px',
        hoverBorderColor: '#5a5a5a',
        background: '#1a1a1a',
        hoverBackgroundColor: '#3a3a3a',
        menuBorderRadius: '6px',
        selectedBackgroundColor: 'rgba(10, 132, 255, 0.2)',
        textColor: '#e0e0e0',
    },
    engine: {
        backgroundColor: '#1a1a1a',
    },
    editor: {
        loadingOverlayBackground: 'rgba(26, 26, 26, 0.85)',
        loadingOverlayColor: '#e0e0e0',
        loadingOverlaySpinnerActiveColor: '#e0e0e0',
        loadingOverlaySpinnerColor: '#555555',
    },
    snap: {
        indicatorFill: 'rgba(10, 132, 255, 0.35)',
        indicatorFillInactive: 'rgba(10, 132, 255, 0.2)',
        indicatorStroke: '#0A84FF',
        indicatorStrokeInactive: 'rgba(255, 255, 255, 0.45)',
        lineStroke: 'rgba(255, 255, 255, 0.35)',
    },
    fontSize: {
        hoverBackgroundColor: '#3a3a3a',
        selectedBackgroundColor: '#3a3a3a',
        textColor: '#e0e0e0',
    },
    lineEndings: {
        hoverBackgroundColor: '#3a3a3a',
        labelColor: '#999999',
        optionBackground: '#2a2a2a',
        selectedBackgroundColor: '#3a3a3a',
    },
    masterDetail: {
        backButtonColor: '#e0e0e0',
        backgroundColor: '#2a2a2a',
        detailBackgroundColor: '#2a2a2a',
        detailFocusOutline: '2px solid #ffffff',
        menuBackgroundColor: '#2a2a2a',
        menuBorderRight: '1px solid #3a3a3a',
        menuItemActiveBackgroundColor: 'hsl(0, 0%, 100%, 12%)',
        menuItemBackgroundColor: 'transparent',
        menuItemChevronColor: '#666666',
        menuItemColor: '#e0e0e0',
        menuItemDisabledColor: '#666666',
        menuItemFocusOutline: '2px solid #ffffff',
        menuItemHoverBackgroundColor: 'hsl(0, 0%, 100%, 8%)',
        menuItemSelectedBackgroundColor: '#0A84FF',
        menuItemSelectedColor: '#ffffff',
        menuItemSelectedHoverBackgroundColor: '#0A84FF',
    },
    menu: {
        backgroundColor: '#2a2a2a',
        border: '1px solid #3a3a3a',
        boxShadow: '0 0 6px rgba(0, 0, 0, 0.3)',
        itemButtonHoverBackgroundColor: 'hsl(0, 0%, 100%, 8%)',
        itemChildOpenBackgroundColor: 'hsl(0, 0%, 100%, 6%)',
        itemColor: '#e0e0e0',
        itemEditingBackgroundColor: '#3a3a3a',
        itemInputBorder: '1px solid #ffffff',
        itemInputBorderColorOnSelected: '#ffffff',
        itemInputCaretColor: '#e0e0e0',
        itemInputCaretColorOnSelected: '#ffffff',
        itemInputSelectionColor: '#b0b0b0',
        itemInputSelectionColorOnSelected: 'rgba(255, 255, 255, 0.35)',
        itemInputSelectionTextColor: '#ffffff',
        itemInputSelectionTextColorOnSelected: '#ffffff',
        itemOverlayBackgroundColor: 'hsl(0, 0%, 100%, 8%)',
        itemSelectedBackgroundColor: '#0A84FF',
        itemSelectedColor: '#ffffff',
    },
    moreMenu: {
        backgroundColor: '#2a2a2a',
        border: '1px solid #3a3a3a',
        borderRadius: '12px',
        boxShadow: '0 0 6px rgba(0, 0, 0, 0.3)',
        buttonActiveBackgroundColor: 'hsl(0, 0%, 100%, 12%)',
        buttonColor: '#ffffff',
        buttonHoverBackgroundColor: 'hsl(0, 0%, 100%, 8%)',
        innerBorderRadius: '12px',
    },
    notificationCard: {
        backgroundColor: '#2a2a2a',
        border: '1px solid #3a3a3a',
        borderRadius: '12px',
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.35)',
        color: '#e0e0e0',
        dismissButtonActiveBackgroundColor: 'hsl(0, 0%, 100%, 12%)',
        dismissButtonBackgroundColor: 'transparent',
        dismissButtonBorderRadius: '6px',
        dismissButtonColor: '#c7c7c7',
        dismissButtonHoverBackgroundColor: 'hsl(0, 0%, 100%, 8%)',
        dismissButtonSize: '24px',
        errorPillBackgroundColor: '#4d1f24',
        errorPillColor: '#ff9aa2',
        headerGap: '8px',
        headerMarginBottom: '8px',
        headerRightGap: '6px',
        infoPillBackgroundColor: '#1f2f4a',
        infoPillColor: '#8bb7ff',
        maxWidth: '360px',
        messageColor: 'inherit',
        messageFontSize: '14px',
        messageLineHeight: '1.45',
        padding: '12px 14px',
        pillBackgroundColor: '#1f2f4a',
        pillBorderRadius: '999px',
        pillColor: '#8bb7ff',
        pillFontSize: '12px',
        pillFontWeight: '600',
        pillHeight: '22px',
        pillPadding: '0 8px',
        timestampColor: '#a0a0a0',
        timestampFontSize: '12px',
        warningPillBackgroundColor: '#4a341f',
        warningPillColor: '#ffd29a',
    },
    numericInput: {
        borderColor: '#4a4a4a',
        borderRadius: '6px',
        focusBorderColor: '#ffffff',
        hoverBorderColor: '#5a5a5a',
        inputBackground: '#1a1a1a',
        labelColor: '#999999',
        selectionBackground: '#0A84FF',
        selectionColor: '#ffffff',
        spinnerActiveBackground: 'hsl(0, 0%, 100%, 12%)',
        spinnerBackground: 'transparent',
        spinnerBorderRadius: '5px',
        spinnerColor: '#e0e0e0',
        spinnerHoverBackground: 'hsl(0, 0%, 100%, 8%)',
        textColor: '#e0e0e0',
    },
    opacitySlider: {
        activeColor: '#0A84FF',
        thumbBorderColor: '#0A84FF',
        thumbColor: '#ffffff',
        trackColor: '#4a4a4a',
    },
    settings: {
        contentHeadingColor: '#ffffff',
        contentTextColor: '#e0e0e0',
        descriptionColor: '#999999',
        labelColor: '#e0e0e0',
        shortcutItemBg: '#3a3a3a',
        shortcutKeyBg: '#2a2a2a',
        shortcutKeyBorder: '#4a4a4a',
        shortcutKeyColor: '#e0e0e0',
    },
    shapeFill: {
        hoverBackgroundColor: '#3a3a3a',
        optionBackground: '#2a2a2a',
        selectedBackgroundColor: '#3a3a3a',
    },
    shareDialog: {
        labelColor: '#e0e0e0',
        descriptionColor: '#e0e0e0',
        inputBackground: '#1a1a1a',
        inputBorderColor: '#4a4a4a',
        inputTextColor: '#e0e0e0',
        selectionColor: '#0A84FF',
        copyButtonBackground: '#2a2a2a',
        copyButtonColor: '#e0e0e0',
        copyButtonHoverBackground: '#3a3a3a',
        copyButtonHoverColor: '#ffffff',
        copySuccessBackground: '#28a745',
        copySuccessColor: '#ffffff',
    },
    slideToggle: {
        thumbColor: '#ffffff',
        trackCheckedColor: '#0A84FF',
        trackColor: '#4a4a4a',
        transitionDuration: '0.2s',
    },
    splitButton: {
        backgroundColor: '#2a2a2a',
        border: '1px solid #3a3a3a',
        boxShadow: '0 0 6px rgba(0, 0, 0, 0.3)',
        color: '#ffffff',
        dividerBackgroundColor: '#3a3a3a',
        hoverBackgroundColor: 'hsl(0, 0%, 100%, 8%)',
    },
    strokeSize: {
        hoverBackgroundColor: '#3a3a3a',
        selectedBackgroundColor: '#3a3a3a',
    },
    tooltip: {
        backgroundColor: '#2a2a2a',
        border: '1px solid #3a3a3a',
        boxShadow: '0 1px 8px rgba(0, 0, 0, 0.4)',
        color: '#ffffff',
    },
    utilityPanel: {
        backgroundColor: '#3a3a3a',
        buttonColor: '#e0e0e0',
        buttonHoverBackgroundColor: 'hsl(0, 0%, 100%, 8%)',
        separatorColor: 'hsl(0, 0%, 100%, 12%)',
    },
    watermark: {
        background: 'rgba(40, 40, 40, 0.6)',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.35)',
        color: 'rgba(220, 220, 220, 0.8)',
    },
    zoomPanel: {
        backgroundColor: '#2a2a2a',
        border: '1px solid #3a3a3a',
        borderRadius: '12px',
        boxShadow: '0 0 3px rgba(0, 0, 0, 0.4)',
        buttonActiveBackgroundColor: 'hsl(0, 0%, 100%, 12%)',
        buttonBorderRadius: '8px',
        buttonHoverBackgroundColor: 'hsl(0, 0%, 100%, 8%)',
        buttonSize: '32px',
        gap: '4px',
        iconColor: '#e0e0e0',
        padding: '4px',
    },
};

class ThemeHelper {
    static appliedVariableNames = new WeakMap();
    /**
     * Converts a camelCase string to kebab-case.
     * @example ThemeHelper.camelToKebab('controlHoverBackgroundColor') → 'control-hover-background-color'
     * @example ThemeHelper.camelToKebab('backgroundColor') → 'background-color'
     * @example ThemeHelper.camelToKebab('gap') → 'gap'
     */
    static camelToKebab(str) {
        return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    }
    /**
     * Recursively flattens a theme object into a map of CSS variable names to values.
     * Skips the 'name' property at the root level since it's the theme identifier, not a CSS value.
     *
     * @param theme - The theme object to flatten
     * @param prefix - The CSS variable prefix (default: '--kritzel')
     * @returns A Map of CSS variable names to their values
     *
     * @example
     * ThemeHelper.flattenThemeToVariables(lightTheme)
     * // Returns Map {
     * //   '--kritzel-global-pointer-cursor' => 'pointer',
    * //   '--kritzel-toolbar-gap' => '8px',
     * //   ...
     * // }
     */
    static flattenThemeToVariables(theme, prefix = '--kritzel') {
        const variables = new Map();
        const recurse = (obj, currentPrefix, isRoot = false) => {
            for (const [key, value] of Object.entries(obj)) {
                // Skip the 'name' property at the root level
                if (isRoot && key === 'name') {
                    continue;
                }
                const kebabKey = ThemeHelper.camelToKebab(key);
                const variableName = `${currentPrefix}-${kebabKey}`;
                if (typeof value === 'object' && value !== null) {
                    recurse(value, variableName);
                }
                else if (typeof value === 'string') {
                    variables.set(variableName, value);
                }
            }
        };
        recurse(theme, prefix, true);
        return variables;
    }
    /**
     * Applies a map of CSS variables to an HTML element.
     *
     * @param element - The target HTML element
     * @param variables - A Map of CSS variable names to values
     */
    static applyVariablesToElement(element, variables) {
        for (const [name, value] of variables) {
            element.style.setProperty(name, value);
        }
    }
    /**
     * Convenience method that flattens a theme and applies it to an element in one call.
     *
     * @param element - The target HTML element
     * @param theme - The theme object to apply
     */
    static applyThemeToElement(element, theme) {
        const variables = ThemeHelper.flattenThemeToVariables(theme);
        const previousVariableNames = ThemeHelper.appliedVariableNames.get(element);
        for (const name of previousVariableNames ?? []) {
            if (!variables.has(name)) {
                element.style.removeProperty(name);
            }
        }
        ThemeHelper.applyVariablesToElement(element, variables);
        ThemeHelper.appliedVariableNames.set(element, new Set(variables.keys()));
    }
}

/** Key used to store the settings object in localStorage. */
const SETTINGS_STORAGE_KEY = 'kritzel-settings';
/** Default theme used when no stored preference exists. */
const DEFAULT_THEME = 'light';
/**
 * Manages theme state and application across the Kritzel editor.
 * Reads the persisted theme from the settings object in localStorage but does not write to it.
 * Persistence is handled exclusively by the KritzelSettings component.
 *
 * The theme manager is responsible for:
 * - Reading the stored theme preference from the settings object
 * - Applying CSS custom properties to target elements
 * - Switching between light and dark themes at runtime
 */
class KritzelThemeManager {
    _core;
    _currentTheme = DEFAULT_THEME;
    _targetElement = null;
    _storageKey;
    _themeRegistry = new Map();
    /**
     * Creates a new KritzelThemeManager instance.
     * Initializes the current theme from the settings object in localStorage or uses the default theme.
     *
     * @param core - The KritzelCore instance this manager belongs to
     */
    constructor(core) {
        this._core = core;
        this._storageKey = core.editorId ? `${SETTINGS_STORAGE_KEY}-${core.editorId}` : SETTINGS_STORAGE_KEY;
        this._themeRegistry.set('light', lightTheme);
        this._themeRegistry.set('dark', darkTheme);
        this._currentTheme = this.getStoredTheme();
        void this._core;
    }
    /**
     * Gets the current active theme name.
     *
     * @returns The name of the currently active theme ('light' or 'dark')
     */
    get currentTheme() {
        return this._currentTheme;
    }
    /**
     * Sets the target element where theme CSS variables will be applied.
     * If an element is provided, the current theme is immediately applied to it.
     *
     * @param element - The HTML element to apply theme styles to, or null to clear
     */
    setTargetElement(element) {
        this._targetElement = element;
        if (this._targetElement) {
            this.applyTheme(this._currentTheme);
        }
    }
    /**
     * Gets the current target element where theme CSS variables are applied.
     *
     * @returns The current target HTML element, or null if none is set
     */
    getTargetElement() {
        return this._targetElement;
    }
    /**
     * Gets the theme configuration object by its name.
     * Falls back to the first registered theme if the requested name is not found.
     *
     * @param themeName - The name of the theme to retrieve
     * @returns The KritzelTheme object containing all theme CSS variable values
     */
    getThemeByName(themeName) {
        return this._themeRegistry.get(themeName) ?? this._themeRegistry.values().next().value;
    }
    /**
     * Registers the provided themes to this theme manager instance.
     *
     * @param themes - The complete list of themes to make available
     */
    registerThemes(themes) {
        if (themes.length === 0) {
            console.warn('[KritzelThemeManager] registerThemes called with an empty array. The theme registry will be empty.');
        }
        this._themeRegistry.clear();
        for (const theme of themes) {
            this._themeRegistry.set(theme.name, theme);
        }
    }
    /**
     * Pre-emptively applies the stored theme's CSS variables to the closest editor or document.
     * This prevents a "Flash of Unstyled Content" (FOUC) while Stencil web components are hydrating.
     *
     * @param element - The HTML element to apply the theme to
     */
    injectThemeEarly(element) {
        let targetElement = element;
        if (!targetElement && typeof document !== 'undefined') {
            targetElement = document.documentElement;
        }
        if (!targetElement)
            return;
        const themeName = this.getStoredTheme();
        const theme = this.getThemeByName(themeName);
        ThemeHelper.applyThemeToElement(targetElement, theme);
    }
    /**
     * Gets all registered themes.
     *
     * @returns An array of all registered theme objects
     */
    getAllThemes() {
        return Array.from(this._themeRegistry.values());
    }
    /**
     * Gets the stored theme name from the settings object in localStorage using this instance's namespaced key.
     *
     * @returns The stored theme name if valid, or 'light' as the default
     */
    getStoredTheme() {
        if (typeof localStorage === 'undefined') {
            return DEFAULT_THEME;
        }
        const stored = localStorage.getItem(this._storageKey);
        if (!stored) {
            return DEFAULT_THEME;
        }
        try {
            const parsed = JSON.parse(stored);
            if (typeof parsed?.theme === 'string') {
                return parsed.theme;
            }
        }
        catch {
            // Invalid JSON, use default
        }
        return DEFAULT_THEME;
    }
    /**
     * Gets the stored theme from the default (non-namespaced) settings object in localStorage.
     * Used by static utility helpers that don't have access to a core instance.
     *
     * @returns The stored theme name if valid, or 'light' as the default
     */
    static getStoredTheme() {
        if (typeof localStorage === 'undefined') {
            return DEFAULT_THEME;
        }
        const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (!stored) {
            return DEFAULT_THEME;
        }
        try {
            const parsed = JSON.parse(stored);
            if (typeof parsed?.theme === 'string') {
                return parsed.theme;
            }
        }
        catch {
            // Invalid JSON, use default
        }
        return DEFAULT_THEME;
    }
    /**
     * Sets the current theme and applies it to the target element.
     * Does not persist the theme — persistence is handled by the KritzelSettings component.
     *
     * @param themeName - The theme name to set ('light' or 'dark')
     */
    setTheme(themeName) {
        this._currentTheme = themeName;
        if (this._targetElement) {
            this.applyTheme(themeName);
        }
    }
    /**
     * Checks if the current theme is the dark theme.
     *
     * @returns True if the current theme is 'dark', false otherwise
     */
    isDarkTheme() {
        return this._currentTheme === 'dark';
    }
    /**
     * Applies a theme to the target element by setting CSS custom properties.
     * Uses the ThemeHelper utility to automatically derive CSS variable names
     * from the theme interface structure and apply them to the element's style.
     * Does nothing if no target element is set.
     *
     * @param themeName - The name of the theme to apply ('light' or 'dark')
     */
    applyTheme(themeName) {
        if (!this._targetElement) {
            return;
        }
        const theme = this.getThemeByName(themeName);
        ThemeHelper.applyThemeToElement(this._targetElement, theme);
    }
    /**
     * Cleans up the theme manager state by clearing the target element reference.
     * Should be called when the manager is no longer needed to prevent memory leaks.
     */
    cleanup() {
        this._targetElement = null;
    }
}

class KritzelColorHelper {
    /**
     * Resolves a color value based on the current theme.
     * Handles both simple string colors and theme-aware color objects.
     * @param color - The color to resolve (string or ThemeAwareColor)
     * @param theme - Optional theme to use. If not provided, uses current theme from ThemeManager
     * @returns The resolved hex color string, or empty string if color is undefined
     */
    static resolveThemeColor(color, theme) {
        if (!color) {
            return '';
        }
        const currentTheme = theme ?? KritzelThemeManager.getStoredTheme();
        return resolveColor(color, currentTheme);
    }
    /**
     * Applies opacity to a theme-aware color and returns an rgba string.
     * @param color - The theme-aware color object or a hex color string
     * @param opacity - The opacity value between 0 and 1
     * @param theme - Optional theme to use. If not provided, uses current theme from ThemeManager
     * @returns The color as an rgba string, or the resolved hex if opacity is 1
     */
    static applyOpacity(color, opacity, theme) {
        const hexColor = typeof color === 'string' ? color : this.resolveThemeColor(color, theme);
        if (!hexColor || opacity >= 1)
            return hexColor;
        const sanitizedHex = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor;
        let r, g, b;
        if (sanitizedHex.length === 3) {
            r = parseInt(sanitizedHex[0] + sanitizedHex[0], 16);
            g = parseInt(sanitizedHex[1] + sanitizedHex[1], 16);
            b = parseInt(sanitizedHex[2] + sanitizedHex[2], 16);
        }
        else if (sanitizedHex.length === 6) {
            r = parseInt(sanitizedHex.substring(0, 2), 16);
            g = parseInt(sanitizedHex.substring(2, 4), 16);
            b = parseInt(sanitizedHex.substring(4, 6), 16);
        }
        else {
            return hexColor;
        }
        if (isNaN(r) || isNaN(g) || isNaN(b)) {
            return hexColor;
        }
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    /**
     * Determines the appropriate contrast color (black or white) based on the luminance of the given hex color.
     * Uses the relative luminance formula: 0.299*R + 0.587*G + 0.114*B
     * @param hexColor - The hex color string (with or without #)
     * @returns '#000000' for light backgrounds, '#ffffff' for dark backgrounds
     */
    static getContrastColor(hexColor) {
        const sanitizedHex = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor;
        let r, g, b;
        if (sanitizedHex.length === 3) {
            r = parseInt(sanitizedHex[0] + sanitizedHex[0], 16);
            g = parseInt(sanitizedHex[1] + sanitizedHex[1], 16);
            b = parseInt(sanitizedHex[2] + sanitizedHex[2], 16);
        }
        else if (sanitizedHex.length === 6) {
            r = parseInt(sanitizedHex.substring(0, 2), 16);
            g = parseInt(sanitizedHex.substring(2, 4), 16);
            b = parseInt(sanitizedHex.substring(4, 6), 16);
        }
        else {
            // Default to black for invalid colors
            return '#000000';
        }
        if (isNaN(r) || isNaN(g) || isNaN(b)) {
            return '#000000';
        }
        // Calculate relative luminance
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        // Use threshold of 150 (midpoint) for balanced contrast
        return luminance > 150 ? '#000000' : '#ffffff';
    }
    /**
     * Determines the appropriate text color for both light and dark themes based on the fill color.
     * Returns default theme-appropriate colors if the fill is transparent.
     * @param fillColor - The theme-aware fill color
     * @returns A theme-aware color object with appropriate text colors for both themes
     */
    static determineTextColor(fillColor) {
        // Check if fillColor is transparent for both themes
        const isTransparentLight = fillColor.light === 'transparent';
        const isTransparentDark = fillColor.dark === 'transparent';
        if (isTransparentLight && isTransparentDark) {
            // Return default theme-appropriate colors for transparent fills
            return { light: '#000000', dark: '#ffffff' };
        }
        // Determine text color for each theme based on fill brightness
        const lightThemeTextColor = isTransparentLight
            ? '#000000'
            : this.getContrastColor(fillColor.light);
        const darkThemeTextColor = isTransparentDark
            ? '#ffffff'
            : this.getContrastColor(fillColor.dark);
        return {
            light: lightThemeTextColor,
            dark: darkThemeTextColor,
        };
    }
}

class KritzelMathHelper {
    static average(a, b) {
        return (a + b) / 2;
    }
    static degreesToRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
}

class KritzelLine extends KritzelBaseObject {
    __class__ = 'KritzelLine';
    startX;
    startY;
    endX;
    endY;
    controlX;
    controlY;
    stroke;
    strokeWidth;
    scale = 1;
    options;
    /** Anchor connection for the start point of the line */
    startAnchor;
    /** Anchor connection for the end point of the line */
    endAnchor;
    /** Arrow head configuration for start and end of line */
    arrows;
    isVisible = true;
    isDebugInfoVisible = true;
    isCompleted = false;
    /** Cached adjusted points for hit testing, accounting for rotation and translation */
    _adjustedPoints = null;
    /** Cached clip information for anchored line endpoints */
    _clipInfo = null;
    /**
     * Generates the SVG path data string for the line.
     * Returns a quadratic Bezier curve path if control point exists, otherwise a straight line.
     * @returns SVG path data string in the format "M x y Q cx cy ex ey" or "M x y L ex ey"
     */
    get d() {
        if (this.controlX !== undefined && this.controlY !== undefined) {
            return `M ${this.startX} ${this.startY} Q ${this.controlX} ${this.controlY} ${this.endX} ${this.endY}`;
        }
        return `M ${this.startX} ${this.startY} L ${this.endX} ${this.endY}`;
    }
    /**
     * Generates the SVG viewBox attribute string for rendering the line.
     * @returns ViewBox string in the format "x y width height"
     */
    get viewBox() {
        return `${this.x} ${this.y} ${this.width} ${this.height}`;
    }
    /**
     * Creates a new KritzelLine instance.
     * @param config - Optional configuration options for the line including start/end points,
     *                 control point for curves, stroke settings, anchors, and arrow configuration
     */
    constructor(config) {
        super();
        this.options = config;
        this.startX = config?.startX ?? 0;
        this.startY = config?.startY ?? 0;
        this.endX = config?.endX ?? 0;
        this.endY = config?.endY ?? 0;
        this.controlX = config?.controlX;
        this.controlY = config?.controlY;
        this.translateX = config?.translateX ?? 0;
        this.translateY = config?.translateY ?? 0;
        this.rotation = KritzelMathHelper.degreesToRadians(config?.rotation ?? 0);
        this.scale = config?.scale ?? 1;
        this.strokeWidth = config?.strokeWidth ?? 4;
        this.stroke = config?.stroke ?? { light: '#000000', dark: '#ffffff' };
        this.startAnchor = config?.startAnchor;
        this.endAnchor = config?.endAnchor;
        this.arrows = config?.arrows;
        this.updateDimensions();
    }
    /**
     * Factory method to create a new KritzelLine with a core reference and unique ID.
     * This is the preferred way to create lines that will be managed by the core.
     * @param core - The KritzelCore instance that will manage this line
     * @param options - Optional configuration options for the line
     * @returns A fully initialized KritzelLine instance with generated ID and workspace assignment
     */
    static create(core, options) {
        const object = new KritzelLine();
        object._core = core;
        object.id = object.generateId();
        object.workspaceId = core.store.state.activeWorkspace.id;
        object.userId = core.user?.id;
        object.options = options;
        object.startX = options?.startX ?? 0;
        object.startY = options?.startY ?? 0;
        object.endX = options?.endX ?? 0;
        object.endY = options?.endY ?? 0;
        object.controlX = options?.controlX;
        object.controlY = options?.controlY;
        object.translateX = options?.translateX ?? 0;
        object.translateY = options?.translateY ?? 0;
        object.rotation = KritzelMathHelper.degreesToRadians(options?.rotation ?? 0);
        object.scale = options?.scale ?? 1;
        object.strokeWidth = options?.strokeWidth ?? 4;
        object.stroke = options?.stroke ?? { light: '#000000', dark: '#ffffff' };
        object.opacity = options?.opacity ?? 1;
        object.startAnchor = options?.startAnchor;
        object.endAnchor = options?.endAnchor;
        object.arrows = options?.arrows;
        object.zIndex = core.store.currentZIndex;
        object.updateDimensions();
        return object;
    }
    /**
     * Resizes the line to fit within the specified dimensions.
     * Scales both endpoints and control point proportionally, then repositions the line.
     * @param x - New X position for the line (or null to keep current)
     * @param y - New Y position for the line (or null to keep current)
     * @param width - New width to scale the line to (must be > 1)
     * @param height - New height to scale the line to (must be > 1)
     */
    resize(x, y, width, height) {
        if (width <= 1 || height <= 1) {
            return;
        }
        const scaleX = width / this.width;
        const scaleY = height / this.height;
        // Scale the line endpoints
        this.startX = this.startX * scaleX;
        this.startY = this.startY * scaleY;
        this.endX = this.endX * scaleX;
        this.endY = this.endY * scaleY;
        if (this.controlX !== undefined && this.controlY !== undefined) {
            this.controlX = this.controlX * scaleX;
            this.controlY = this.controlY * scaleY;
        }
        // Recalculate dimensions from scaled endpoints
        const { minX, minY, maxX, maxY } = this.calculateBoundingBox();
        this.width = maxX - minX;
        this.height = maxY - minY;
        this.x = minX;
        this.y = minY;
        // Set the new position
        this.translateX = x;
        this.translateY = y;
        this._adjustedPoints = null;
        this._clipInfo = null;
        this._core.store.objects.update(this);
        // Update anchors after the line is updated
        this._core.anchorManager.updateAnchorsForObject(this.id);
        if (this.startAnchor) {
            this._core.anchorManager.updateAnchorsForObject(this.startAnchor.objectId);
        }
        if (this.endAnchor) {
            this._core.anchorManager.updateAnchorsForObject(this.endAnchor.objectId);
        }
    }
    /**
     * Sets the rotation angle of the line around its center.
     * Invalidates cached adjusted points and clip info.
     * @param value - Rotation angle in radians
     */
    rotate(value) {
        this.rotation = value;
        this._adjustedPoints = null;
        this._clipInfo = null;
        this._core.store.objects.update(this);
    }
    /**
     * Moves the line by calculating the delta between start and end positions.
     * Updates anchored objects if the line has anchor connections.
     * @param startX - Starting X position of the drag in screen coordinates
     * @param startY - Starting Y position of the drag in screen coordinates
     * @param endX - Ending X position of the drag in screen coordinates
     * @param endY - Ending Y position of the drag in screen coordinates
     */
    move(startX, startY, endX, endY) {
        const deltaX = (startX - endX) / this._core.store.state.scale;
        const deltaY = (startY - endY) / this._core.store.state.scale;
        this.translateX += deltaX;
        this.translateY += deltaY;
        // If the line is anchored, we need to ensure the anchored endpoints stay at the target
        if (this.startAnchor) {
            this._core.anchorManager.updateAnchorsForObject(this.startAnchor.objectId);
        }
        if (this.endAnchor) {
            this._core.anchorManager.updateAnchorsForObject(this.endAnchor.objectId);
        }
        this._adjustedPoints = null;
        this._clipInfo = null;
        this._core.store.objects.update(this);
    }
    /**
     * Tests if a point intersects with the line within the stroke tolerance.
     * Uses distance to line segment for straight lines, or distance to Bezier curve for curved lines.
     * @param x - X coordinate of the point to test in world coordinates
     * @param y - Y coordinate of the point to test in world coordinates
     * @returns True if the point is within the stroke width tolerance of the line
     */
    hitTest(x, y) {
        const minHitThreshold = 20;
        const strokeWidth = Math.max(this.strokeWidth, minHitThreshold);
        const halfStroke = strokeWidth / this.scale / 2;
        if (this._adjustedPoints === null) {
            this._adjustedPoints = this.computeAdjustedPoints();
        }
        // For curved lines, use distance to the Bezier curve
        if (this.controlX !== undefined && this.controlY !== undefined) {
            const clip = this.getClipInfo();
            const startT = clip.start?.t ?? 0;
            const endT = clip.end?.t ?? 1;
            const distance = this.pointToBezierDistance(x, y, startT, endT);
            return distance <= halfStroke;
        }
        // For straight lines, use distance to line segment
        const clip = this.getClipInfo();
        const p1 = clip.start ? [clip.start.x, clip.start.y] : this._adjustedPoints[0];
        const p2 = clip.end ? [clip.end.x, clip.end.y] : this._adjustedPoints[1];
        const distance = this.pointToLineSegmentDistance(x, y, p1[0], p1[1], p2[0], p2[1]);
        return distance <= halfStroke;
    }
    /**
     * Tests if the line intersects with or is contained within a polygon.
     * Checks endpoint containment, polygon vertex proximity, curve sampling for Bezier curves,
     * and line-edge intersections for straight lines.
     * @param polygon - The polygon to test intersection with, defined by four corner points
     * @returns True if any part of the line intersects with the polygon
     */
    hitTestPolygon(polygon) {
        const halfStroke = this.strokeWidth / this.scale / 2;
        if (this._adjustedPoints === null) {
            this._adjustedPoints = this.computeAdjustedPoints();
        }
        const clip = this.getClipInfo();
        const polyPoints = [
            { x: polygon.bottomLeft.x, y: polygon.bottomLeft.y },
            { x: polygon.bottomRight.x, y: polygon.bottomRight.y },
            { x: polygon.topRight.x, y: polygon.topRight.y },
            { x: polygon.topLeft.x, y: polygon.topLeft.y },
        ];
        // Check if any endpoint is inside the polygon
        // Use clipped endpoints
        const p1 = clip.start ? [clip.start.x, clip.start.y] : this._adjustedPoints[0];
        const p2 = clip.end ? [clip.end.x, clip.end.y] : this._adjustedPoints[1];
        const endpoints = [p1, p2];
        for (const [px, py] of endpoints) {
            if (KritzelGeometryHelper.isPointInPolygon({ x: px, y: py }, polyPoints)) {
                return true;
            }
        }
        // Check if any polygon vertex is on the line/curve
        for (const pt of polyPoints) {
            if (this.hitTest(pt.x, pt.y)) {
                return true;
            }
        }
        // For curved lines, sample points along the curve and check if any are inside the polygon
        if (this.controlX !== undefined && this.controlY !== undefined) {
            const p0 = this._adjustedPoints[0];
            const p2 = this._adjustedPoints[1];
            const controlAdjusted = this.computeAdjustedControlPoint();
            const startT = clip.start?.t ?? 0;
            const endT = clip.end?.t ?? 1;
            const samples = 20;
            for (let i = 0; i <= samples; i++) {
                const fraction = i / samples;
                const t = startT + fraction * (endT - startT);
                const oneMinusT = 1 - t;
                const bx = oneMinusT * oneMinusT * p0[0] + 2 * oneMinusT * t * controlAdjusted[0] + t * t * p2[0];
                const by = oneMinusT * oneMinusT * p0[1] + 2 * oneMinusT * t * controlAdjusted[1] + t * t * p2[1];
                if (KritzelGeometryHelper.isPointInPolygon({ x: bx, y: by }, polyPoints)) {
                    return true;
                }
                // Also check if curve point is within stroke distance of polygon edges
                for (let j = 0; j < polyPoints.length; j++) {
                    const q1 = polyPoints[j];
                    const q2 = polyPoints[(j + 1) % polyPoints.length];
                    const d = this.pointToLineSegmentDistance(bx, by, q1.x, q1.y, q2.x, q2.y);
                    if (d <= halfStroke) {
                        return true;
                    }
                }
            }
            return false;
        }
        // For straight lines, check if line intersects any polygon edge
        const checkP1 = { x: p1[0], y: p1[1] };
        const checkP2 = { x: p2[0], y: p2[1] };
        for (let j = 0; j < polyPoints.length; j++) {
            const q1 = polyPoints[j];
            const q2 = polyPoints[(j + 1) % polyPoints.length];
            if (KritzelGeometryHelper.intersectLines(checkP1, checkP2, q1, q2)) {
                return true;
            }
            // Check distance from polygon edges to line segment
            const d1 = this.pointToLineSegmentDistance(q1.x, q1.y, checkP1.x, checkP1.y, checkP2.x, checkP2.y);
            const d2 = this.pointToLineSegmentDistance(q2.x, q2.y, checkP1.x, checkP1.y, checkP2.x, checkP2.y);
            const d3 = this.pointToLineSegmentDistance(checkP1.x, checkP1.y, q1.x, q1.y, q2.x, q2.y);
            const d4 = this.pointToLineSegmentDistance(checkP2.x, checkP2.y, q1.x, q1.y, q2.x, q2.y);
            const minD = Math.min(d1, d2, d3, d4);
            if (minD <= halfStroke) {
                return true;
            }
        }
        return false;
    }
    /**
     * Updates the translation position of the line without recalculating dimensions.
     * Invalidates cached adjusted points and clip info.
     * @param x - New X translation in world coordinates
     * @param y - New Y translation in world coordinates
     */
    updatePosition(x, y) {
        this.translateX = x;
        this.translateY = y;
        this._adjustedPoints = null;
        this._clipInfo = null;
        this._core.store.objects.update(this);
    }
    /**
     * Updates a specific endpoint of the line (start or end).
     * Recalculates the bounding box dimensions and adjusts translation to maintain
     * the visual position after the origin shift, accounting for rotation.
     * @param handleType - Which endpoint to update: 'start' or 'end'
     * @param newX - New X coordinate in viewBox-local space (relative to x, y origin)
     * @param newY - New Y coordinate in viewBox-local space (relative to x, y origin)
     */
    updateEndpoint(handleType, newX, newY) {
        // Update the appropriate endpoint
        if (handleType === 'start') {
            this.startX = newX;
            this.startY = newY;
        }
        else {
            this.endX = newX;
            this.endY = newY;
        }
        const oldWidth = this.width;
        const oldHeight = this.height;
        // Recalculate the bounding box (viewBox dimensions)
        const { minX, minY, maxX, maxY } = this.calculateBoundingBox();
        // Calculate the change in origin (in local coordinates)
        const deltaX = minX - this.x;
        const deltaY = minY - this.y;
        const newWidth = maxX - minX;
        const newHeight = maxY - minY;
        const deltaWidth = newWidth - oldWidth;
        const deltaHeight = newHeight - oldHeight;
        const deltaCx = deltaWidth / 2;
        const deltaCy = deltaHeight / 2;
        // Update viewBox dimensions
        this.x = minX;
        this.y = minY;
        this.width = newWidth;
        this.height = newHeight;
        // Rotate the delta to world coordinates before applying to translate
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        // We need to compensate for:
        // 1. The shift of the top-left corner (deltaX, deltaY)
        // 2. The shift of the center point (deltaCx, deltaCy) which affects rotation pivot
        // Formula: DeltaT = R(DeltaPos + DeltaCenter) - DeltaCenter
        const vx = deltaX + deltaCx;
        const vy = deltaY + deltaCy;
        const rotatedVx = vx * cos - vy * sin;
        const rotatedVy = vx * sin + vy * cos;
        const correctionX = rotatedVx - deltaCx;
        const correctionY = rotatedVy - deltaCy;
        // Adjust translateX/Y to compensate for the origin shift
        // so the line stays visually in the same position
        this.translateX += correctionX / this.scale;
        this.translateY += correctionY / this.scale;
        // Clear cached adjusted points
        this._adjustedPoints = null;
        this._clipInfo = null;
        this._core.store.objects.update(this);
    }
    /**
     * Updates the control point for a quadratic Bezier curve.
     * Recalculates bounding box and adjusts translation to maintain visual position.
     * Pass undefined for both parameters to convert the line back to a straight line.
     * @param newX - New X coordinate for the control point, or undefined to remove
     * @param newY - New Y coordinate for the control point, or undefined to remove
     */
    updateControlPoint(newX, newY) {
        this.controlX = newX;
        this.controlY = newY;
        const oldWidth = this.width;
        const oldHeight = this.height;
        // Recalculate the bounding box (viewBox dimensions)
        const { minX, minY, maxX, maxY } = this.calculateBoundingBox();
        // Calculate the change in origin (in local coordinates)
        const deltaX = minX - this.x;
        const deltaY = minY - this.y;
        const newWidth = maxX - minX;
        const newHeight = maxY - minY;
        const deltaWidth = newWidth - oldWidth;
        const deltaHeight = newHeight - oldHeight;
        const deltaCx = deltaWidth / 2;
        const deltaCy = deltaHeight / 2;
        // Update viewBox dimensions
        this.x = minX;
        this.y = minY;
        this.width = newWidth;
        this.height = newHeight;
        // Rotate the delta to world coordinates before applying to translate
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        // We need to compensate for:
        // 1. The shift of the top-left corner (deltaX, deltaY)
        // 2. The shift of the center point (deltaCx, deltaCy) which affects rotation pivot
        // Formula: DeltaT = R(DeltaPos + DeltaCenter) - DeltaCenter
        const vx = deltaX + deltaCx;
        const vy = deltaY + deltaCy;
        const rotatedVx = vx * cos - vy * sin;
        const rotatedVy = vx * sin + vy * cos;
        const correctionX = rotatedVx - deltaCx;
        const correctionY = rotatedVy - deltaCy;
        // Adjust translateX/Y to compensate for the origin shift
        // so the line stays visually in the same position
        this.translateX += correctionX / this.scale;
        this.translateY += correctionY / this.scale;
        // Clear cached adjusted points
        this._adjustedPoints = null;
        this._clipInfo = null;
        this._core.store.objects.update(this);
    }
    /**
     * Computes the line endpoints in world coordinates, accounting for rotation,
     * scale, and translation transformations.
     * @returns Array of two points [[startX, startY], [endX, endY]] in world coordinates
     */
    computeAdjustedPoints() {
        const points = [
            [this.startX, this.startY],
            [this.endX, this.endY],
        ];
        const angle = this.rotation;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const xs = points.map(p => p[0]);
        const ys = points.map(p => p[1]);
        const pivot = {
            x: (Math.min(...xs) + Math.max(...xs)) / 2,
            y: (Math.min(...ys) + Math.max(...ys)) / 2,
        };
        const { x: cx, y: cy } = pivot;
        const rotatedPoints = points.map(([x, y]) => {
            const dx = x - cx;
            const dy = y - cy;
            return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
        });
        return rotatedPoints.map(([px, py]) => [(px - this.x) / this.scale + this.translateX, (py - this.y) / this.scale + this.translateY]);
    }
    /**
     * Calculates the minimum distance from a point to a line segment.
     * Uses parametric projection to find the closest point on the segment.
     * @param x - X coordinate of the test point
     * @param y - Y coordinate of the test point
     * @param x1 - X coordinate of the segment start
     * @param y1 - Y coordinate of the segment start
     * @param x2 - X coordinate of the segment end
     * @param y2 - Y coordinate of the segment end
     * @returns The minimum distance from the point to the line segment
     */
    pointToLineSegmentDistance(x, y, x1, y1, x2, y2) {
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;
        if (len_sq !== 0) {
            param = dot / len_sq;
        }
        let xx, yy;
        if (param < 0) {
            xx = x1;
            yy = y1;
        }
        else if (param > 1) {
            xx = x2;
            yy = y2;
        }
        else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        const dx = x - xx;
        const dy = y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
    /**
     * Calculates the minimum distance from a point to a quadratic Bezier curve.
     * Uses sampling along the curve (20 samples) to approximate the closest point.
     * @param x - X coordinate of the test point in world coordinates
     * @param y - Y coordinate of the test point in world coordinates
     * @param startT - Start parameter for curve sampling (0-1), used for clipped curves
     * @param endT - End parameter for curve sampling (0-1), used for clipped curves
     * @returns The minimum distance from the point to the sampled curve
     */
    pointToBezierDistance(x, y, startT = 0, endT = 1) {
        if (this._adjustedPoints === null) {
            this._adjustedPoints = this.computeAdjustedPoints();
        }
        const p0 = this._adjustedPoints[0];
        const p2 = this._adjustedPoints[1];
        // Calculate the adjusted control point
        const controlAdjusted = this.computeAdjustedControlPoint();
        let minDistance = Infinity;
        const samples = 20; // Number of samples along the curve
        for (let i = 0; i <= samples; i++) {
            const fraction = i / samples;
            const t = startT + fraction * (endT - startT);
            const oneMinusT = 1 - t;
            // Quadratic Bezier: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
            const bx = oneMinusT * oneMinusT * p0[0] + 2 * oneMinusT * t * controlAdjusted[0] + t * t * p2[0];
            const by = oneMinusT * oneMinusT * p0[1] + 2 * oneMinusT * t * controlAdjusted[1] + t * t * p2[1];
            const dx = x - bx;
            const dy = y - by;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < minDistance) {
                minDistance = distance;
            }
        }
        return minDistance;
    }
    /**
     * Retrieves or computes the clip information for anchored line endpoints.
     * Caches the result to avoid recalculation on subsequent calls.
     * @returns Object containing optional start and end clip points with world coordinates
     *          and parametric t values for curve clipping
     */
    getClipInfo() {
        if (this._clipInfo)
            return this._clipInfo;
        const startAnchor = this.startAnchor;
        const endAnchor = this.endAnchor;
        const result = {};
        if (startAnchor) {
            const target = this._core.anchorManager.findAnchorTarget(this, 'start');
            if (target) {
                const clip = this._core.anchorManager.computeAnchorClipInfo(this, 'start', target);
                if (clip) {
                    result.start = { x: clip.worldX, y: clip.worldY, t: clip.t };
                }
            }
        }
        if (endAnchor) {
            const target = this._core.anchorManager.findAnchorTarget(this, 'end');
            if (target) {
                const clip = this._core.anchorManager.computeAnchorClipInfo(this, 'end', target);
                if (clip) {
                    result.end = { x: clip.worldX, y: clip.worldY, t: clip.t };
                }
            }
        }
        this._clipInfo = result;
        return result;
    }
    /**
     * Computes the adjusted control point in world coordinates.
     * Applies rotation around the bounding box center, then scale and translation transforms.
     * @returns Array [x, y] representing the control point in world coordinates,
     *          or the midpoint of the line if no control point is defined
     */
    computeAdjustedControlPoint() {
        if (this.controlX === undefined || this.controlY === undefined) {
            // Return midpoint if no control point
            return [(this.startX + this.endX) / 2, (this.startY + this.endY) / 2];
        }
        const angle = this.rotation;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        // Calculate pivot (center of bounding box for endpoints)
        const xs = [this.startX, this.endX];
        const ys = [this.startY, this.endY];
        const pivot = {
            x: (Math.min(...xs) + Math.max(...xs)) / 2,
            y: (Math.min(...ys) + Math.max(...ys)) / 2,
        };
        const { x: cx, y: cy } = pivot;
        // Rotate control point around pivot
        const dx = this.controlX - cx;
        const dy = this.controlY - cy;
        const rotatedX = cx + dx * cos - dy * sin;
        const rotatedY = cy + dx * sin + dy * cos;
        // Transform to world coordinates
        return [(rotatedX - this.x) / this.scale + this.translateX, (rotatedY - this.y) / this.scale + this.translateY];
    }
    /**
     * Gets the bounding polygon of the line in world coordinates, accounting for rotation.
     * Used for selection bounds and intersection testing.
     * @returns A polygon with four corner points (topLeft, topRight, bottomRight, bottomLeft)
     *          transformed to world coordinates with rotation applied
     */
    get rotatedPolygon() {
        const padding = this.padding;
        // Use the bounding box which accounts for curve extrema
        const { minX, minY, maxX, maxY } = KritzelLine.calculateBoundingBox(this.startX, this.startY, this.endX, this.endY, this.controlX, this.controlY, this.strokeWidth);
        // Convert to local coordinates (relative to this.x, this.y)
        const localMinX = minX - this.x + padding;
        const localMinY = minY - this.y + padding;
        const localMaxX = maxX - this.x + padding;
        const localMaxY = maxY - this.y + padding;
        const c1 = { x: localMinX, y: localMinY }; // top-left
        const c2 = { x: localMaxX, y: localMinY }; // top-right
        const c3 = { x: localMaxX, y: localMaxY }; // bottom-right
        const c4 = { x: localMinX, y: localMaxY }; // bottom-left
        const cx = this.totalWidth / 2;
        const cy = this.totalHeight / 2;
        const angle = this.rotation;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const transform = (p) => {
            const rx = (p.x - cx) * cos - (p.y - cy) * sin + cx;
            const ry = (p.x - cx) * sin + (p.y - cy) * cos + cy;
            return {
                x: rx / this.scale + this.translateX,
                y: ry / this.scale + this.translateY,
            };
        };
        return {
            topLeft: transform(c1),
            topRight: transform(c2),
            bottomRight: transform(c3),
            bottomLeft: transform(c4),
        };
    }
    /**
     * Calculates the tight bounding box for a quadratic Bezier curve or straight line.
     * For curves, finds extrema points where the derivative equals zero to ensure
     * the bounding box encompasses the entire curve arc.
     * @param startX - X coordinate of the line start point
     * @param startY - Y coordinate of the line start point
     * @param endX - X coordinate of the line end point
     * @param endY - Y coordinate of the line end point
     * @param controlX - X coordinate of the control point (undefined for straight lines)
     * @param controlY - Y coordinate of the control point (undefined for straight lines)
     * @param strokeWidth - Width of the line stroke for padding calculation
     * @returns Object with minX, minY, maxX, maxY including stroke width padding
     */
    static calculateBoundingBox(startX, startY, endX, endY, controlX, controlY, strokeWidth) {
        let minX = Math.min(startX, endX);
        let minY = Math.min(startY, endY);
        let maxX = Math.max(startX, endX);
        let maxY = Math.max(startY, endY);
        if (controlX !== undefined && controlY !== undefined) {
            // For a quadratic Bezier: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
            // Derivative: B'(t) = 2(1-t)(P₁-P₀) + 2t(P₂-P₁) = 0
            // Solving for t: t = (P₀ - P₁) / (P₀ - 2P₁ + P₂)
            // Find extrema for X
            const aX = startX - 2 * controlX + endX;
            if (aX !== 0) {
                const tX = (startX - controlX) / aX;
                if (tX > 0 && tX < 1) {
                    const extremaX = (1 - tX) * (1 - tX) * startX + 2 * (1 - tX) * tX * controlX + tX * tX * endX;
                    minX = Math.min(minX, extremaX);
                    maxX = Math.max(maxX, extremaX);
                }
            }
            // Find extrema for Y
            const aY = startY - 2 * controlY + endY;
            if (aY !== 0) {
                const tY = (startY - controlY) / aY;
                if (tY > 0 && tY < 1) {
                    const extremaY = (1 - tY) * (1 - tY) * startY + 2 * (1 - tY) * tY * controlY + tY * tY * endY;
                    minY = Math.min(minY, extremaY);
                    maxY = Math.max(maxY, extremaY);
                }
            }
        }
        const halfStroke = strokeWidth / 2;
        return {
            minX: minX - halfStroke,
            minY: minY - halfStroke,
            maxX: maxX + halfStroke,
            maxY: maxY + halfStroke,
        };
    }
    /**
     * Calculates the bounding box for this line instance using the current endpoint,
     * control point, and stroke width values.
     * @returns Object with minX, minY, maxX, maxY bounds including stroke width padding
     */
    calculateBoundingBox() {
        return KritzelLine.calculateBoundingBox(this.startX, this.startY, this.endX, this.endY, this.controlX, this.controlY, this.strokeWidth);
    }
    /**
     * Serializes the line while excluding transient cache fields.
     * @returns A serializable line object without runtime caches
     */
    serialize() {
        const serialized = super.serialize();
        delete serialized._adjustedPoints;
        delete serialized._clipInfo;
        return serialized;
    }
    /**
     * Deserializes and resets transient caches so geometry is recomputed lazily.
     * @param object - The serialized line object
     * @returns This instance cast to type T
     */
    deserialize(object) {
        const result = super.deserialize(object);
        this._adjustedPoints = null;
        this._clipInfo = null;
        return result;
    }
    /**
     * Recalculates and updates the width, height, x, y, and translation properties
     * based on the current endpoint positions and stroke width.
     * Called during construction and after endpoint changes.
     */
    updateDimensions() {
        const { minX, minY, maxX, maxY } = this.calculateBoundingBox();
        this.width = maxX - minX;
        this.height = maxY - minY;
        this.x = minX;
        this.y = minY;
        this.translateX = (this.x + this.translateX) / this.scale;
        this.translateY = (this.y + this.translateY) / this.scale;
    }
    /**
     * Gets the unique SVG marker ID for the arrow head at the start of the line.
     * Used in SVG defs for marker-start attribute.
     * @returns A unique marker ID string in the format "arrow-start-{lineId}"
     */
    get startMarkerId() {
        return `arrow-start-${this.id}`;
    }
    /**
     * Gets the unique SVG marker ID for the arrow head at the end of the line.
     * Used in SVG defs for marker-end attribute.
     * @returns A unique marker ID string in the format "arrow-end-{lineId}"
     */
    get endMarkerId() {
        return `arrow-end-${this.id}`;
    }
    /**
     * Gets the arrow head size for the specified end of the line.
     * @param end - Which end to get the arrow size for: 'start' or 'end'
     * @returns The configured arrow size, or strokeWidth * 3 as default
     */
    getArrowSize(end) {
        const config = end === 'start' ? this.arrows?.start : this.arrows?.end;
        return config?.size ?? this.strokeWidth * 3;
    }
    /**
     * Gets the resolved fill color for the arrow head at the specified end.
     * Resolves theme-aware colors to the appropriate value for the current theme.
     * @param end - Which end to get the arrow fill for: 'start' or 'end'
     * @returns The resolved CSS color string for the arrow fill
     */
    getArrowFill(end) {
        const config = end === 'start' ? this.arrows?.start : this.arrows?.end;
        const color = config?.fill ?? this.stroke;
        return KritzelColorHelper.resolveThemeColor(color, this._core?.themeManager?.currentTheme);
    }
    /**
     * Generates SVG path data for an arrow head based on the given style.
     * All paths are designed to fit in a 10x10 viewBox with the tip at (10, 5).
     * @param style - The arrow head style: 'triangle' (filled), 'open' (outline),
     *                'diamond' (rhombus), or 'circle'. Defaults to 'triangle'.
     * @returns SVG path data string for use in a marker element
     */
    getArrowPath(style = 'triangle') {
        switch (style) {
            case 'triangle':
                return 'M 0 0 L 10 5 L 0 10 z';
            case 'open':
                return 'M 0 0 L 10 5 L 0 10';
            case 'diamond':
                return 'M 0 5 L 5 0 L 10 5 L 5 10 z';
            case 'circle':
                return 'M 5,0 A 5,5 0 1,1 5,10 A 5,5 0 1,1 5,0';
            default:
                return 'M 0 0 L 10 5 L 0 10 z';
        }
    }
    /**
     * Checks if an arrow head is enabled at the start of the line.
     * @returns True if the start arrow configuration exists and is enabled
     */
    get hasStartArrow() {
        return this.arrows?.start?.enabled === true;
    }
    /**
     * Checks if an arrow head is enabled at the end of the line.
     * @returns True if the end arrow configuration exists and is enabled
     */
    get hasEndArrow() {
        return this.arrows?.end?.enabled === true;
    }
}

var cjs = {};

var hasRequiredCjs;

function requireCjs () {
	if (hasRequiredCjs) return cjs;
	hasRequiredCjs = 1;
	(function (exports) {
		Object.defineProperties(exports,{__esModule:{value:!0},[Symbol.toStringTag]:{value:`Module`}});const{PI:e}=Math,t=e+1e-4,n=.5,r=[1,1];function i(e,t,n,r=e=>e){return e*r(.5-t*(.5-n))}const{min:a}=Math;function o(e,t,n){let r=a(1,t/n);return a(1,e+(a(1,1-r)-e)*(r*.275))}function s(e){return [-e[0],-e[1]]}function c(e,t){return [e[0]+t[0],e[1]+t[1]]}function l(e,t,n){return e[0]=t[0]+n[0],e[1]=t[1]+n[1],e}function u(e,t){return [e[0]-t[0],e[1]-t[1]]}function d(e,t,n){return e[0]=t[0]-n[0],e[1]=t[1]-n[1],e}function f(e,t){return [e[0]*t,e[1]*t]}function p(e,t,n){return e[0]=t[0]*n,e[1]=t[1]*n,e}function m(e,t){return [e[0]/t,e[1]/t]}function h(e){return [e[1],-e[0]]}function g(e,t){let n=t[0];return e[0]=t[1],e[1]=-n,e}function ee(e,t){return e[0]*t[0]+e[1]*t[1]}function _(e,t){return e[0]===t[0]&&e[1]===t[1]}function v(e){return Math.hypot(e[0],e[1])}function y(e,t){let n=e[0]-t[0],r=e[1]-t[1];return n*n+r*r}function b(e){return m(e,v(e))}function x(e,t){return Math.hypot(e[1]-t[1],e[0]-t[0])}function S(e,t,n){let r=Math.sin(n),i=Math.cos(n),a=e[0]-t[0],o=e[1]-t[1],s=a*i-o*r,c=a*r+o*i;return [s+t[0],c+t[1]]}function C(e,t,n,r){let i=Math.sin(r),a=Math.cos(r),o=t[0]-n[0],s=t[1]-n[1],c=o*a-s*i,l=o*i+s*a;return e[0]=c+n[0],e[1]=l+n[1],e}function w(e,t,n){return c(e,f(u(t,e),n))}function te(e,t,n,r){let i=n[0]-t[0],a=n[1]-t[1];return e[0]=t[0]+i*r,e[1]=t[1]+a*r,e}function T(e,t,n){return c(e,f(t,n))}const E=[0,0],D=[0,0],O=[0,0];function k(e,n){let r=T(e,b(h(u(e,c(e,[1,1])))),-n),i=[],a=1/13;for(let n=a;n<=1;n+=a)i.push(S(r,e,t*2*n));return i}function A(e,n,r){let i=[],a=1/r;for(let r=a;r<=1;r+=a)i.push(S(n,e,t*r));return i}function j(e,t,n){let r=u(t,n),i=f(r,.5),a=f(r,.51);return [u(e,i),u(e,a),c(e,a),c(e,i)]}function M(e,n,r,i){let a=[],o=T(e,n,r),s=1/i;for(let n=s;n<1;n+=s)a.push(S(o,e,t*3*n));return a}function ne(e,t,n){return [c(e,f(t,n)),c(e,f(t,n*.99)),u(e,f(t,n*.99)),u(e,f(t,n))]}function N(e,t,n){return e===!1||e===void 0?0:e===!0?Math.max(t,n):e}function re(e,t,n){return e.slice(0,10).reduce((e,r)=>{let i=r.pressure;return t&&(i=o(e,r.distance,n)),(e+i)/2},e[0].pressure)}function P(e,n={}){let{size:r=16,smoothing:a=.5,thinning:f=.5,simulatePressure:m=!0,easing:_=e=>e,start:v={},end:b={},last:x=!1}=n,{cap:S=!0,easing:w=e=>e*(2-e)}=v,{cap:T=!0,easing:P=e=>--e*e*e+1}=b;if(e.length===0||r<=0)return [];let F=e[e.length-1].runningLength,I=N(v.taper,r,F),L=N(b.taper,r,F),R=(r*a)**2,z=[],B=[],V=re(e,m,r),H=i(r,f,e[e.length-1].pressure,_),U,W=e[0].vector,G=e[0].point,K=G,q=G,J=K,Y=!1;for(let n=0;n<e.length;n++){let{pressure:a}=e[n],{point:s,vector:h,distance:v,runningLength:b}=e[n],x=n===e.length-1;if(!x&&F-b<3)continue;f?(m&&(a=o(V,v,r)),H=i(r,f,a,_)):H=r/2,U===void 0&&(U=H);let S=b<I?w(b/I):1,T=F-b<L?P((F-b)/L):1;H=Math.max(.01,H*Math.min(S,T));let k=(x?e[n]:e[n+1]).vector,A=x?1:ee(h,k),j=ee(h,W)<0&&!Y,M=A!==null&&A<0;if(j||M){g(E,W),p(E,E,H);for(let e=0;e<=1;e+=.07692307692307693)d(D,s,E),C(D,D,s,t*e),q=[D[0],D[1]],z.push(q),l(O,s,E),C(O,O,s,t*-e),J=[O[0],O[1]],B.push(J);G=q,K=J,M&&(Y=!0);continue}if(Y=!1,x){g(E,h),p(E,E,H),z.push(u(s,E)),B.push(c(s,E));continue}te(E,k,h,A),g(E,E),p(E,E,H),d(D,s,E),q=[D[0],D[1]],(n<=1||y(G,q)>R)&&(z.push(q),G=q),l(O,s,E),J=[O[0],O[1]],(n<=1||y(K,J)>R)&&(B.push(J),K=J),V=a,W=h;}let X=[e[0].point[0],e[0].point[1]],Z=e.length>1?[e[e.length-1].point[0],e[e.length-1].point[1]]:c(e[0].point,[1,1]),Q=[],$=[];if(e.length===1){if(!(I||L)||x)return k(X,U||H)}else {I||L&&e.length===1||(S?Q.push(...A(X,B[0],13)):Q.push(...j(X,z[0],B[0])));let t=h(s(e[e.length-1].vector));L||I&&e.length===1?$.push(Z):T?$.push(...M(Z,t,H,29)):$.push(...ne(Z,t,H));}return z.concat($,B.reverse(),Q)}const F=[0,0];function I(e){return e!=null&&e>=0}function L(e,t={}){let{streamline:i=.5,size:a=16,last:o=!1}=t;if(e.length===0)return [];let s=.15+(1-i)*.85,l=Array.isArray(e[0])?e:e.map(({x:e,y:t,pressure:r=n})=>[e,t,r]);if(l.length===2){let e=l[1];l=l.slice(0,-1);for(let t=1;t<5;t++)l.push(w(l[0],e,t/4));}l.length===1&&(l=[...l,[...c(l[0],r),...l[0].slice(2)]]);let u=[{point:[l[0][0],l[0][1]],pressure:I(l[0][2])?l[0][2]:.25,vector:[...r],distance:0,runningLength:0}],f=!1,p=0,m=u[0],h=l.length-1;for(let e=1;e<l.length;e++){let t=o&&e===h?[l[e][0],l[e][1]]:w(m.point,l[e],s);if(_(m.point,t))continue;let r=x(t,m.point);if(p+=r,e<h&&!f){if(p<a)continue;f=!0;}d(F,m.point,t),m={point:t,pressure:I(l[e][2])?l[e][2]:n,vector:b(F),distance:r,runningLength:p},u.push(m);}return u[0].vector=u[1]?.vector||[0,0],u}function R(e,t={}){return P(L(e,t),t)}var z=R;exports.default=z,exports.getStroke=R,exports.getStrokeOutlinePoints=P,exports.getStrokePoints=L;
		
	} (cjs));
	return cjs;
}

var cjsExports = requireCjs();
var index = /*@__PURE__*/getDefaultExportFromCjs(cjsExports);

class KritzelPath extends KritzelBaseObject {
    __class__ = 'KritzelPath';
    points;
    d;
    stroke = { light: 'none', dark: 'none' };
    strokeWidth;
    lineSlack = 0.5;
    fill;
    x = 0;
    y = 0;
    height = 0;
    width = 0;
    scale = 1;
    options;
    isVisible = true;
    isDebugInfoVisible = true;
    isCompleted = false;
    _adjustedPoints = null;
    /**
     * Gets the SVG viewBox string for local (object-relative) rendering.
     *
     * The path's `d` string is generated in local coordinates (offset so the
     * object's top-left origin is at 0,0), so the viewBox always starts at 0,0.
     * Keeping the SVG's internal coordinates small — independent of the object's
     * world position — avoids float32 precision loss in the browser's SVG
     * rasterizer (Skia), which otherwise fails to paint paths whose absolute
     * world coordinates exceed ~2^24 (e.g. far from the origin at extreme zoom).
     * @returns The viewBox attribute value in the format "0 0 width height"
     */
    get viewBox() {
        return `0 0 ${this.width} ${this.height}`;
    }
    /**
     * Creates a new KritzelPath instance.
     * @param config - Optional configuration object for the path
     * @param config.points - Array of [x, y] coordinate pairs defining the path
     * @param config.translateX - Horizontal translation offset (default: 0)
     * @param config.translateY - Vertical translation offset (default: 0)
     * @param config.scale - Scale factor for the path (default: 1)
     * @param config.strokeWidth - Width of the stroke in pixels (default: 8)
     * @param config.fill - Theme-aware fill color with light and dark variants
     * @param config.lineSlack - Additional padding for bounding box calculations (default: 0.5)
     */
    constructor(config) {
        super();
        this.options = config;
        this.points = config?.points ?? [];
        this.translateX = config?.translateX ?? 0;
        this.translateY = config?.translateY ?? 0;
        this.rotation = KritzelMathHelper.degreesToRadians(config?.rotation ?? 0);
        this.scale = config?.scale ?? 1;
        this.strokeWidth = config?.strokeWidth ?? 8;
        this.fill = config?.fill ?? { light: '#000000', dark: '#ffffff' };
        this.d = this.generateSvgPath();
        this.updateDimensions();
    }
    /**
     * Factory method to create a new KritzelPath instance with a core reference.
     * This is the preferred way to create paths that will be managed by the canvas.
     * @param core - The KritzelCore instance that will manage this path
     * @param options - Optional configuration options for the path
     * @returns A new KritzelPath instance configured with the provided options
     */
    static create(core, options) {
        const object = new KritzelPath();
        object._core = core;
        object.id = object.generateId();
        object.workspaceId = core.store.state.activeWorkspace.id;
        object.userId = core.user?.id;
        object.options = options;
        object.points = options?.points ?? [];
        object.translateX = options?.translateX ?? 0;
        object.translateY = options?.translateY ?? 0;
        object.rotation = KritzelMathHelper.degreesToRadians(options?.rotation ?? 0);
        object.scale = options?.scale ?? 1;
        object.strokeWidth = options?.strokeWidth ?? 8;
        object.fill = options?.fill ?? { light: '#000000', dark: '#ffffff' };
        object.opacity = options?.opacity ?? 1;
        object.zIndex = core.store.currentZIndex;
        object.d = object.generateSvgPath();
        object.updateDimensions();
        return object;
    }
    /**
     * Creates a deep copy of this path object.
     * The points array is cloned to ensure the copy is independent.
     * @returns A new KritzelPath instance with copied properties
     */
    copy() {
        const copiedObject = super.copy();
        if (this.points) {
            copiedObject.points = this.points.map(p => [...p]);
        }
        return copiedObject;
    }
    /**
     * Restores the path from a serialized object, then regenerates the SVG `d`
     * string from the restored points.
     *
     * Regeneration is required because the `d` string is now emitted in local
     * (object-relative) coordinates paired with a "0 0 width height" viewBox.
     * Older persisted paths stored `d` in absolute world coordinates, which
     * would be inconsistent with the local-coordinate viewBox and fail to
     * rasterize far from the origin at extreme zoom. Recomputing `d` here makes
     * both freshly created and previously persisted paths render identically.
     * @param object - The serialized path data to restore from
     * @returns This instance cast to type T
     */
    deserialize(object) {
        const result = super.deserialize(object);
        this.d = this.generateSvgPath();
        return result;
    }
    /**
     * Resizes the path to fit within the specified dimensions.
     * Scales all points proportionally and updates the SVG path.
     * @param x - New X position for the path, or null to keep current
     * @param y - New Y position for the path, or null to keep current
     * @param width - New width for the path (must be > 1)
     * @param height - New height for the path (must be > 1)
     */
    resize(x, y, width, height) {
        if (width <= 1 || height <= 1) {
            return;
        }
        const scaleX = width / this.width;
        const scaleY = height / this.height;
        this.width = width;
        this.height = height;
        if (this.points.length === 1) {
            const p = this.points[0];
            const spreadX = Math.max(0, width - this.strokeWidth) / scaleX;
            const spreadY = Math.max(0, height - this.strokeWidth) / scaleY;
            this.points.push([p[0] + spreadX, p[1] + spreadY]);
        }
        this.points = this.points.map(([x, y]) => [x * scaleX, y * scaleY]);
        this.d = this.generateSvgPath();
        this.width = Math.max(...this.points.map(p => p[0])) - Math.min(...this.points.map(p => p[0])) + this.strokeWidth;
        this.height = Math.max(...this.points.map(p => p[1])) - Math.min(...this.points.map(p => p[1])) + this.strokeWidth;
        this.x = Math.min(...this.points.map(p => p[0])) - this.strokeWidth / 2;
        this.y = Math.min(...this.points.map(p => p[1])) - this.strokeWidth / 2;
        if (x !== null) {
            this.translateX = x;
        }
        if (y !== null) {
            this.translateY = y;
        }
        this._adjustedPoints = null;
        this._core.store.objects.update(this);
    }
    /**
     * Rotates the path by the specified angle.
     * Invalidates cached adjusted points to force recalculation.
     * @param value - Rotation angle in radians
     */
    rotate(value) {
        this.rotation = value;
        this._adjustedPoints = null;
        this._core.store.objects.update(this);
    }
    /**
     * Moves the path by calculating the delta between start and end positions.
     * The delta is adjusted for the current viewport scale.
     * @param startX - Starting X coordinate in screen space
     * @param startY - Starting Y coordinate in screen space
     * @param endX - Ending X coordinate in screen space
     * @param endY - Ending Y coordinate in screen space
     */
    move(startX, startY, endX, endY) {
        const deltaX = (startX - endX) / this._core.store.state.scale;
        const deltaY = (startY - endY) / this._core.store.state.scale;
        this.translateX += deltaX;
        this.translateY += deltaY;
        this._adjustedPoints = null;
        this._core.store.objects.update(this);
    }
    /**
     * Tests whether a point intersects with the path's stroke.
     * Uses distance-to-line-segment calculations for accurate hit detection.
     * @param x - X coordinate to test in world space
     * @param y - Y coordinate to test in world space
     * @returns True if the point is within the stroke width of the path
     */
    hitTest(x, y) {
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
    /**
     * Tests whether a polygon intersects with the path.
     * Checks for point containment, edge intersections, and proximity to stroke.
     * @param polygon - The polygon to test against, defined by its corner points
     * @returns True if any part of the polygon overlaps with the path's stroke
     */
    hitTestPolygon(polygon) {
        const halfStroke = this.strokeWidth / this.scale / 2;
        if (this._adjustedPoints === null) {
            this._adjustedPoints = this.computeAdjustedPoints();
        }
        const polyPoints = [
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
    /**
     * Updates the path's position to the specified coordinates.
     * Invalidates cached adjusted points and triggers a store update.
     * @param x - New X position in world space
     * @param y - New Y position in world space
     */
    updatePosition(x, y) {
        this.translateX = x;
        this.translateY = y;
        this._adjustedPoints = null;
        this._core.store.objects.update(this);
    }
    /**
     * Lifecycle hook called after properties have been updated.
     * Regenerates the SVG path and bounding box when strokeWidth changes.
     * @param changedProperties - Array of property names that were modified
     */
    onAfterUpdate(changedProperties) {
        if (changedProperties.includes('strokeWidth')) {
            this.d = this.generateSvgPath();
            this.updateBoundingBox();
            this._adjustedPoints = null;
        }
    }
    /**
     * Computes the world-space coordinates of all path points.
     * Applies rotation around the path's center and adjusts for translation and scale.
     * Results are cached in _adjustedPoints for performance.
     * @returns Array of [x, y] coordinate pairs in world space
     */
    computeAdjustedPoints() {
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
    /**
     * Calculates the shortest distance from a point to a line segment.
     * Uses projection to find the closest point on the segment.
     * @param x - X coordinate of the test point
     * @param y - Y coordinate of the test point
     * @param x1 - X coordinate of the line segment start
     * @param y1 - Y coordinate of the line segment start
     * @param x2 - X coordinate of the line segment end
     * @param y2 - Y coordinate of the line segment end
     * @returns The shortest distance from the point to the line segment
     */
    pointToLineSegmentDistance(x, y, x1, y1, x2, y2) {
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
        }
        else if (param > 1) {
            xx = x2;
            yy = y2;
        }
        else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        const dx = x - xx;
        const dy = y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
    /**
     * Updates width, height, x, y, translateX, and translateY based on current points.
     * Uses the unrotated local points and stroke width for base dimensions.
     * Called during initial setup to establish the path's dimensions and position.
     */
    updateDimensions() {
        const minX = Math.min(...this.points.map(p => p[0])) - this.strokeWidth / 2;
        const minY = Math.min(...this.points.map(p => p[1])) - this.strokeWidth / 2;
        const maxX = Math.max(...this.points.map(p => p[0])) + this.strokeWidth / 2;
        const maxY = Math.max(...this.points.map(p => p[1])) + this.strokeWidth / 2;
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
    updateBoundingBox() {
        const minX = Math.min(...this.points.map(p => p[0])) - this.strokeWidth / 2;
        const minY = Math.min(...this.points.map(p => p[1])) - this.strokeWidth / 2;
        const maxX = Math.max(...this.points.map(p => p[0])) + this.strokeWidth / 2;
        const maxY = Math.max(...this.points.map(p => p[1])) + this.strokeWidth / 2;
        this.width = maxX - minX + this.lineSlack;
        this.height = maxY - minY + this.lineSlack;
        this.x = minX;
        this.y = minY;
    }
    /**
     * Generates the SVG path data string from the current points.
     * Uses perfect-freehand to create a smooth, pressure-sensitive stroke.
     * @returns SVG path data string (d attribute value)
     */
    generateSvgPath() {
        const stroke = this.getStrokeFromPoints(this.points, this.strokeWidth);
        const offsetX = this.points.length ? Math.min(...this.points.map(p => p[0])) - this.strokeWidth / 2 : 0;
        const offsetY = this.points.length ? Math.min(...this.points.map(p => p[1])) - this.strokeWidth / 2 : 0;
        return this.getSvgPathFromStroke(stroke, offsetX, offsetY);
    }
    /**
     * Converts raw input points into a smooth stroke outline using perfect-freehand.
     * Applies pressure simulation and smoothing for a natural pen-like appearance.
     * @param points - Array of [x, y] coordinate pairs representing the input path
     * @param strokeWidth - The desired stroke width in pixels
     * @returns Array of [x, y] coordinate pairs forming the stroke outline polygon
     */
    getStrokeFromPoints(points, strokeWidth) {
        return cjsExports.getStroke(points, {
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
    /**
     * Converts stroke outline points into an SVG path data string.
     * Uses quadratic bezier curves for smooth rendering.
     * Coordinates are emitted relative to (offsetX, offsetY) so the resulting
     * path lives in the object's local coordinate space (paired with a
     * "0 0 width height" viewBox). This keeps SVG-internal coordinates small
     * regardless of the object's world position, avoiding float32 rasterizer
     * precision failures far from the origin.
     * @param points - Array of [x, y] coordinate pairs forming the stroke outline
     * @param offsetX - X origin to subtract from every coordinate (default 0)
     * @param offsetY - Y origin to subtract from every coordinate (default 0)
     * @param closed - Whether to close the path with 'Z' command (default: true)
     * @returns SVG path data string with M, Q, and T commands
     */
    getSvgPathFromStroke(points, offsetX = 0, offsetY = 0, closed = true) {
        const len = points.length;
        if (len < 4) {
            return ``;
        }
        const a = points[0];
        const b = points[1];
        const c = points[2];
        const ax = a[0] - offsetX;
        const ay = a[1] - offsetY;
        const bx = b[0] - offsetX;
        const by = b[1] - offsetY;
        const cx = c[0] - offsetX;
        const cy = c[1] - offsetY;
        let result = `M${ax.toFixed(2)},${ay.toFixed(2)} Q${bx.toFixed(2)},${by.toFixed(2)} ${KritzelMathHelper.average(bx, cx).toFixed(2)},${KritzelMathHelper.average(by, cy).toFixed(2)} T`;
        for (let i = 2, max = len - 1; i < max; i++) {
            const p = points[i];
            const q = points[i + 1];
            const px = p[0] - offsetX;
            const py = p[1] - offsetY;
            const qx = q[0] - offsetX;
            const qy = q[1] - offsetY;
            result += `${KritzelMathHelper.average(px, qx).toFixed(2)},${KritzelMathHelper.average(py, qy).toFixed(2)} `;
        }
        if (closed) {
            result += 'Z';
        }
        return result;
    }
    /**
     * Determines if the path appears too small on screen for detailed rendering.
     * Used for level-of-detail optimizations.
     * @returns True if the path's screen area is less than 500 square pixels
     */
    isLowRes() {
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
     * intersects the stroke edge. Used for arrow clipping at the actual stroke edge.
     * Uses binary search refinement for accurate intersection detection.
     * @param outsidePoint - A point outside the path to trace from
     * @returns The intersection point on the stroke edge, or null if no intersection found
     */
    getClipPoint(outsidePoint) {
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
            }
            else {
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
                    }
                    else {
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
                    }
                    else {
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
    getSupportedExportFormats() {
        return ['svg'];
    }
    async exportAs(format, context) {
        if (format !== 'svg') {
            return null;
        }
        return context.getObjectAsSvgDataUrl(this);
    }
}

export { DEFAULT_COLOR_PALETTE as D, KritzelBaseObject as K, ObjectHelper as O, KritzelLine as a, KritzelMathHelper as b, KritzelGeometryHelper as c, KritzelColorHelper as d, KritzelPath as e, KritzelThemeManager as f };
//# sourceMappingURL=path.class-DavJ_cvx.js.map

//# sourceMappingURL=path.class-DavJ_cvx.js.map