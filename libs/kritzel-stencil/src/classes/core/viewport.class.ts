import { KritzelBaseObject } from '../..';
import { KritzelMouseButton } from '../../enums/event-button.enum';
import { KritzelCore } from './core.class';
import { KritzelSelectionBox } from '../objects/selection-box.class';
import { debounce, DebouncedFunc } from 'lodash';

export class KritzelViewport {
  private readonly _core: KritzelCore;
  private readonly _debounceUpdate: DebouncedFunc<() => void>;
  private readonly _debounceEndScaling: DebouncedFunc<() => void>;
  private _animationFrameId: number | null = null;

  initialTouchDistance: number = 0;
  startX: number = 0;
  startY: number = 0;

  constructor(core: KritzelCore, host: HTMLElement) {
    this._core = core;
    this._core.store.state.host = host;
    this._core.store.state.viewportWidth = host.clientWidth;
    this._core.store.state.viewportHeight = host.clientHeight;
    this._core.store.state.startX = 0;
    this._core.store.state.startY = 0;
    this._core.store.state.translateX = 0;
    this._core.store.state.translateY = 0;

    this._debounceUpdate = debounce(() => {
      this._core.updateWorkspaceViewport(
        this._core.store.state.translateX,
        this._core.store.state.translateY,
        this._core.store.state.scale
      );
    }, 300);

    this._debounceEndScaling = debounce(() => {
      this._core.store.state.isScaling = false;
      this._core.rerender();
    }, 100);
  }

  /**
   * Cancels any pending debounced viewport updates.
   * Should be called before switching workspaces to prevent the old workspace's
   * viewport state from being saved to the new workspace.
   */
  cancelPendingUpdates(): void {
    this._debounceUpdate.cancel();
  }

  handleResize(): void {
    this._core.store.state.viewportWidth = this._core.store.state.host.clientWidth;
    this._core.store.state.viewportHeight = this._core.store.state.host.clientHeight;
    this._core.store.state.hasViewportChanged = true;
    this._core.rerender();
  }

  handlePointerDown(event: PointerEvent): void {
    // Cancel any ongoing viewport animation when user starts interacting
    this.cancelViewportAnimation();

    if (event.pointerType === 'mouse') {
      const adjustedClientX = event.clientX - this._core.store.offsetX;
      const adjustedClientY = event.clientY - this._core.store.offsetY;

      if (event.button === KritzelMouseButton.Right) {
        this._core.store.state.isPanning = true;
        this._core.store.state.startX = adjustedClientX;
        this._core.store.state.startY = adjustedClientY;
      }
    }

    if (event.pointerType === 'touch') {
      const activePointers = Array.from(this._core.store.state.pointers.values());

      if (activePointers.length === 2) {
        const currentPath = this._core.store.currentPath;
        if (currentPath) {
          this._core.store.state.objects.remove(obj => obj.id === currentPath.id);
        }

        // Clear selection box when scaling starts to prevent it from remaining on screen
        if (this._core.store.state.isSelecting) {
          this._core.store.state.isSelecting = false;
          this._core.store.state.objects.remove(obj => obj instanceof KritzelSelectionBox);
          // Clear selection preview state from objects
          this._core.store.allNonSelectionObjects.forEach(object => {
            object.isSelected = false;
          });
        }

        this._core.store.state.isScaling = true;

        const firstTouchX = activePointers[0].clientX - this._core.store.offsetX;
        const firstTouchY = activePointers[0].clientY - this._core.store.offsetY;

        const secondTouchX = activePointers[1].clientX - this._core.store.offsetX;
        const secondTouchY = activePointers[1].clientY - this._core.store.offsetY;

        this.initialTouchDistance = Math.sqrt(Math.pow(firstTouchX - secondTouchX, 2) + Math.pow(firstTouchY - secondTouchY, 2));

        this.startX = (firstTouchX + secondTouchX) / 2;
        this.startY = (firstTouchY + secondTouchY) / 2;
        this._core.rerender();
      }
    }
  }

  handlePointerMove(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      const hostRect = this._core.store.state.host.getBoundingClientRect();
      const xRelativeToHost = event.clientX - hostRect.left;
      const yRelativeToHost = event.clientY - hostRect.top;

      this._core.store.state.pointerX = (xRelativeToHost - this._core.store.state.translateX) / this._core.store.state.scale;
      this._core.store.state.pointerY = (yRelativeToHost - this._core.store.state.translateY) / this._core.store.state.scale;

      if (this._core.store.state.isPanning) {
        const dx = xRelativeToHost - this._core.store.state.startX;
        const dy = yRelativeToHost - this._core.store.state.startY;

        this._core.store.state.translateX += dx;
        this._core.store.state.translateY += dy;
        this._core.store.state.startX = xRelativeToHost;
        this._core.store.state.startY = yRelativeToHost;
        this._core.store.state.hasViewportChanged = true;
        this._core.store.state.skipContextMenu = true;

        this._core.rerender();
        this._debounceUpdate();
      }
    }

    if (event.pointerType === 'touch') {
      const hostRect = this._core.store.state.host.getBoundingClientRect();
      const xRelativeToHost = event.clientX - hostRect.left;
      const yRelativeToHost = event.clientY - hostRect.top;

      this._core.store.state.pointerX = (xRelativeToHost - this._core.store.state.translateX) / this._core.store.state.scale;
      this._core.store.state.pointerY = (yRelativeToHost - this._core.store.state.translateY) / this._core.store.state.scale;

      const activePointers = Array.from(this._core.store.state.pointers.values());

      if (activePointers.length === 2) {
        const firstTouchX = activePointers[0].clientX - this._core.store.offsetX;
        const firstTouchY = activePointers[0].clientY - this._core.store.offsetY;

        const secondTouchX = activePointers[1].clientX - this._core.store.offsetX;
        const secondTouchY = activePointers[1].clientY - this._core.store.offsetY;

        const currentTouchDistance = Math.sqrt(Math.pow(firstTouchX - secondTouchX, 2) + Math.pow(firstTouchY - secondTouchY, 2));

        const midpointX = (firstTouchX + secondTouchX) / 2;
        const midpointY = (firstTouchY + secondTouchY) / 2;

        const scaleRatio = currentTouchDistance / this.initialTouchDistance!;
        const newScale = this._core.store.state.scale * scaleRatio;

        if (newScale > this._core.store.state.scaleMax || newScale < this._core.store.state.scaleMin) {
          this._core.store.state.translateX = this._core.store.state.translateX + midpointX - this.startX;
          this._core.store.state.translateY = this._core.store.state.translateY + midpointY - this.startY;
        } else {
          const translateXAdjustment = (midpointX - this._core.store.state.translateX) * (scaleRatio - 1);
          const translateYAdjustment = (midpointY - this._core.store.state.translateY) * (scaleRatio - 1);

          this._core.store.state.translateX = this._core.store.state.translateX + midpointX - this.startX - translateXAdjustment;
          this._core.store.state.translateY = this._core.store.state.translateY + midpointY - this.startY - translateYAdjustment;
          this._core.store.state.scale = newScale;

          this.initialTouchDistance = currentTouchDistance;
        }

        this.startX = midpointX;
        this.startY = midpointY;

        this._core.store.state.hasViewportChanged = true;

        this._core.rerender();
        this._debounceUpdate();
      }
    }
  }

  handlePointerUp(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      if (this._core.store.state.isPanning) {
        this._core.store.state.isPanning = false;
        this._core.rerender();
      }
    }

    if (event.pointerType === 'touch') {

      if (this._core.store.state.pointers.size === 0) {
        this._debounceEndScaling();
      }
    }
  }

  handleWheel(event: WheelEvent): void {
    // Cancel any ongoing viewport animation when user scrolls
    this.cancelViewportAnimation();

    if (event.ctrlKey === true && Math.abs(event.deltaY) > 0 && Math.abs(event.deltaX) === 0) {
      this.handleZoom(event);
    }

    if (!event.ctrlKey) {
      this.handlePan(event);
    }
  }

  centerInViewport(object: KritzelBaseObject): void {
    const { scale, viewportWidth, viewportHeight } = this._core.store.state;
    const { x, y, width, height } = object.rotatedBoundingBox;

    const objectCenterX = x + width / 2;
    const objectCenterY = y + height / 2;

    this._core.store.state.translateX = viewportWidth / 2 - objectCenterX * scale;
    this._core.store.state.translateY = viewportHeight / 2 - objectCenterY * scale;
    this._core.store.state.hasViewportChanged = true;

    this._core.rerender();
    this._debounceUpdate();
  }

  centerFitInViewport(object: KritzelBaseObject): void {
    const scaleX = this._core.store.state.viewportWidth / (object.rotatedBoundingBox.width * 1.1);
    const scaleY = this._core.store.state.viewportHeight / (object.rotatedBoundingBox.height * 1.1);
    const newScale = Math.min(scaleX, scaleY, this._core.store.state.scaleMax);
    const clampedScale = Math.max(newScale, this._core.store.state.scaleMin);

    this._core.store.state.scale = clampedScale;
    this.centerInViewport(object);
  }

  private handleZoom(event: WheelEvent): void {
    this._core.store.state.isScaling = true;
    const rect = this._core.store.state.host.getBoundingClientRect();
    const xRelativeToHost = event.clientX - rect.left;
    const yRelativeToHost = event.clientY - rect.top;

    this._core.store.state.pointerX = (xRelativeToHost - this._core.store.state.translateX) / this._core.store.state.scale;
    this._core.store.state.pointerY = (yRelativeToHost - this._core.store.state.translateY) / this._core.store.state.scale;

    const rawScaleFactor = 1 + (event.deltaY * -0.012);
    const scaleFactor = Math.max(0.8, Math.min(1.2, rawScaleFactor));
    const newScale = Math.min(this._core.store.state.scaleMax, Math.max(this._core.store.state.scaleMin, this._core.store.state.scale * scaleFactor));

    const scaleRatio = newScale / this._core.store.state.scale;
    const translateXAdjustment = (xRelativeToHost - this._core.store.state.translateX) * (scaleRatio - 1);
    const translateYAdjustment = (yRelativeToHost - this._core.store.state.translateY) * (scaleRatio - 1);

    this._core.store.state.scale = newScale;

    this._core.store.state.translateX = this._core.store.state.translateX - translateXAdjustment;
    this._core.store.state.translateY = this._core.store.state.translateY - translateYAdjustment;

    this._core.store.state.hasViewportChanged = true;

    this._core.rerender();
    this._debounceUpdate();
    this._debounceEndScaling();
  }

  private handlePan(event: WheelEvent): void {
    const panSpeed = 0.8;

    this._core.store.state.translateX = this._core.store.state.translateX - event.deltaX * panSpeed;
    this._core.store.state.translateY = this._core.store.state.translateY - event.deltaY * panSpeed;

    this._core.store.state.hasViewportChanged = true;

    this._core.rerender();
    this._debounceUpdate();
  }

  /**
   * Cancels any ongoing viewport animation.
   * Called when user interacts with the canvas during animation.
   */
  cancelViewportAnimation(): void {
    if (this._animationFrameId !== null) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }
  }

  /**
   * Animates the viewport to the specified position and scale.
   * @param targetTranslateX - Target X translation
   * @param targetTranslateY - Target Y translation
   * @param targetScale - Target scale
   * @param duration - Animation duration in milliseconds (default 150)
   */
  animateViewportTo(targetTranslateX: number, targetTranslateY: number, targetScale: number, duration = 150): void {
    // Cancel any existing animation
    this.cancelViewportAnimation();

    const startTranslateX = this._core.store.state.translateX;
    const startTranslateY = this._core.store.state.translateY;
    const startScale = this._core.store.state.scale;
    const startTime = performance.now();

    const animate = (currentTime: number): void => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic easing function
      const eased = 1 - Math.pow(1 - progress, 3);

      this._core.store.state.translateX = startTranslateX + (targetTranslateX - startTranslateX) * eased;
      this._core.store.state.translateY = startTranslateY + (targetTranslateY - startTranslateY) * eased;
      this._core.store.state.scale = startScale + (targetScale - startScale) * eased;
      this._core.store.state.hasViewportChanged = true;
      this._core.rerender();

      if (progress < 1) {
        this._animationFrameId = requestAnimationFrame(animate);
      } else {
        this._animationFrameId = null;
        this._debounceUpdate();
      }
    };

    this._animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Centers and fits the nearest content objects in the viewport.
   * Finds up to maxObjects closest objects to the current viewport center
   * and animates the viewport to show them.
   * @param maxObjects - Maximum number of objects to consider (default 20)
   * @returns true if content was found and viewport is animating, false if no content exists
   */
  centerFitNearestContent(maxObjects = 20): boolean {
    const allObjects = this._core.store.allNonSelectionObjects;

    if (allObjects.length === 0) {
      return false;
    }

    // Calculate current viewport center in canvas coordinates
    const viewportCenterX = -this._core.store.state.translateX / this._core.store.state.scale + this._core.store.state.viewportWidth / 2 / this._core.store.state.scale;
    const viewportCenterY = -this._core.store.state.translateY / this._core.store.state.scale + this._core.store.state.viewportHeight / 2 / this._core.store.state.scale;

    // Sort objects by distance from viewport center (using object center)
    const objectsWithDistance = allObjects.map(obj => {
      const bounds = obj.rotatedBoundingBox;
      const objectCenterX = bounds.x + bounds.width / 2;
      const objectCenterY = bounds.y + bounds.height / 2;
      const distance = Math.sqrt(
        Math.pow(objectCenterX - viewportCenterX, 2) + Math.pow(objectCenterY - viewportCenterY, 2)
      );
      return { obj, distance };
    });

    objectsWithDistance.sort((a, b) => a.distance - b.distance);

    // Take up to maxObjects closest objects
    const nearestObjects = objectsWithDistance.slice(0, maxObjects).map(item => item.obj);

    // Calculate combined bounds of nearest objects
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const obj of nearestObjects) {
      const bounds = obj.rotatedBoundingBox;
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.width);
      maxY = Math.max(maxY, bounds.y + bounds.height);
    }

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const contentCenterX = minX + contentWidth / 2;
    const contentCenterY = minY + contentHeight / 2;

    // Calculate scale to fit with 10% padding
    const scaleX = this._core.store.state.viewportWidth / (contentWidth * 1.1);
    const scaleY = this._core.store.state.viewportHeight / (contentHeight * 1.1);
    const newScale = Math.min(scaleX, scaleY, this._core.store.state.scaleMax);
    const clampedScale = Math.max(newScale, this._core.store.state.scaleMin);

    // Calculate target translation to center content
    const targetTranslateX = this._core.store.state.viewportWidth / 2 - contentCenterX * clampedScale;
    const targetTranslateY = this._core.store.state.viewportHeight / 2 - contentCenterY * clampedScale;

    // Animate to the target position
    this.animateViewportTo(targetTranslateX, targetTranslateY, clampedScale);

    return true;
  }
}
