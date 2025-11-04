import { KritzelBaseObject } from '../..';
import { KritzelMouseButton } from '../../enums/event-button.enum';
import { KritzelCore } from './core.class';

export class KritzelViewport {
  private readonly _core: KritzelCore;
  private readonly _debounceUpdate: () => void;

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

    this._debounceUpdate = this.debounce(() => {
      this._core.updateWorkspaceViewport(this._core.store.state.translateX, this._core.store.state.translateY, this._core.store.state.scale);
    }, 0);
  }

  private debounce(func: () => void, delay: number): () => void {
    let timeoutId: ReturnType<typeof setTimeout>;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(func, delay);
    };
  }

  handleResize(): void {
    this._core.store.state.viewportWidth = this._core.store.state.host.clientWidth;
    this._core.store.state.viewportHeight = this._core.store.state.host.clientHeight;
    this._core.store.state.hasViewportChanged = true;
    this._core.rerender();
  }

  handlePointerDown(event: PointerEvent): void {
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
          this._core.store.state.objectsMap.remove(obj => obj.id === currentPath.id);
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
        this._core.store.state.isScaling = false;
        this._core.rerender();
      }
    }
  }

  handleWheel(event: WheelEvent): void {
    event.preventDefault();

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

    const delta = event.deltaY > 0 ? -this._core.store.state.scaleStep * this._core.store.state.scale : this._core.store.state.scaleStep * this._core.store.state.scale;
    const newScale = Math.min(this._core.store.state.scaleMax, Math.max(this._core.store.state.scaleMin, this._core.store.state.scale + delta));

    const scaleRatio = newScale / this._core.store.state.scale;
    const translateXAdjustment = (xRelativeToHost - this._core.store.state.translateX) * (scaleRatio - 1);
    const translateYAdjustment = (yRelativeToHost - this._core.store.state.translateY) * (scaleRatio - 1);

    this._core.store.state.scale = newScale;

    this._core.store.state.translateX = this._core.store.state.translateX - translateXAdjustment;
    this._core.store.state.translateY = this._core.store.state.translateY - translateYAdjustment;

    this._core.store.state.hasViewportChanged = true;

    this._core.rerender();
    this._debounceUpdate();

    setTimeout(() => {
      this._core.store.state.isScaling = false;
    }, 300);
  }

  private handlePan(event: WheelEvent): void {
    const panSpeed = 0.8;

    this._core.store.state.translateX = this._core.store.state.translateX - event.deltaX * panSpeed;
    this._core.store.state.translateY = this._core.store.state.translateY - event.deltaY * panSpeed;

    this._core.store.state.hasViewportChanged = true;

    this._core.rerender();
    this._debounceUpdate();
  }
}
