import { KritzelMouseButton } from '../enums/event-button.enum';
import { KritzelEventHelper } from '../helpers/event.helper';
import { KritzelStore } from './store.class';

export class KritzelViewport {
  private readonly _store: KritzelStore;

  initialTouchDistance: number = 0;
  startX: number = 0;
  startY: number = 0;

  constructor(store: KritzelStore, host: HTMLElement) {
    this._store = store;
    this._store.state.host = host;
    this._store.state.viewportWidth = host.clientWidth;
    this._store.state.viewportHeight = host.clientHeight;
    this._store.state.startX = 0;
    this._store.state.startY = 0;
    this._store.state.translateX = 0;
    this._store.state.translateY = 0;
  }

  handleResize(): void {
    this._store.state.viewportWidth = this._store.state.host.clientWidth;
    this._store.state.viewportHeight = this._store.state.host.clientHeight;
    this._store.state.hasViewportChanged = true;
    this._store.rerender();
  }

  handlePointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      const adjustedClientX = event.clientX - this._store.offsetX;
      const adjustedClientY = event.clientY - this._store.offsetY;

      if (event.button === KritzelMouseButton.Right) {
        this._store.state.isPanning = true;
        this._store.state.startX = adjustedClientX;
        this._store.state.startY = adjustedClientY;
      }
    }

    if (event.pointerType === 'touch') {
      const activePointers = Array.from(this._store.state.pointers.values());

      if (activePointers.length === 2) {
        this._store.state.currentPath = null;
        this._store.state.isScaling = true;

        const firstTouchX = activePointers[0].clientX - this._store.offsetX;
        const firstTouchY = activePointers[0].clientY - this._store.offsetY;

        const secondTouchX = activePointers[1].clientX - this._store.offsetX;
        const secondTouchY = activePointers[1].clientY - this._store.offsetY;

        this.initialTouchDistance = Math.sqrt(Math.pow(firstTouchX - secondTouchX, 2) + Math.pow(firstTouchY - secondTouchY, 2));

        this.startX = (firstTouchX + secondTouchX) / 2;
        this.startY = (firstTouchY + secondTouchY) / 2;
        this._store.rerender();
      }
    }
  }

  handlePointerMove(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      const adjustedClientX = event.clientX - this._store.offsetX;
      const adjustedClientY = event.clientY - this._store.offsetY;

      this._store.state.cursorX = adjustedClientX;
      this._store.state.cursorY = adjustedClientY;

      if (this._store.state.isPanning) {
        this._store.state.translateX -= this._store.state.startX - adjustedClientX;
        this._store.state.translateY -= this._store.state.startY - adjustedClientY;
        this._store.state.startX = adjustedClientX;
        this._store.state.startY = adjustedClientY;
        this._store.state.hasViewportChanged = true;
        this._store.state.skipContextMenu = true;
        this._store.rerender();
      }
    }

    if (event.pointerType === 'touch') {
      const activePointers = Array.from(this._store.state.pointers.values());

      if (activePointers.length === 2) {
        const firstTouchX = activePointers[0].clientX - this._store.offsetX;
        const firstTouchY = activePointers[0].clientY - this._store.offsetY;

        const secondTouchX = activePointers[1].clientX - this._store.offsetX;
        const secondTouchY = activePointers[1].clientY - this._store.offsetY;

        const currentTouchDistance = Math.sqrt(Math.pow(firstTouchX - secondTouchX, 2) + Math.pow(firstTouchY - secondTouchY, 2));

        const midpointX = (firstTouchX + secondTouchX) / 2;
        const midpointY = (firstTouchY + secondTouchY) / 2;

        const scaleRatio = currentTouchDistance / this.initialTouchDistance!;
        const newScale = this._store.state.scale * scaleRatio;

        if (newScale > this._store.state.scaleMax || newScale < this._store.state.scaleMin) {
          this._store.state.translateX += midpointX - this.startX;
          this._store.state.translateY += midpointY - this.startY;
        } else {
          const translateXAdjustment = (midpointX - this._store.state.translateX) * (scaleRatio - 1);
          const translateYAdjustment = (midpointY - this._store.state.translateY) * (scaleRatio - 1);

          this._store.state.translateX += midpointX - this.startX - translateXAdjustment;
          this._store.state.translateY += midpointY - this.startY - translateYAdjustment;
          this._store.state.scale = newScale;

          this.initialTouchDistance = currentTouchDistance;
        }

        this.startX = midpointX;
        this.startY = midpointY;

        this._store.state.hasViewportChanged = true;

        this._store.rerender();
      }
    }
  }

  handlePointerUp(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      if (this._store.state.isPanning) {
        this._store.state.isPanning = false;
        this._store.rerender();
      }
    }

    if (event.pointerType === 'touch') {
      this._store.state.isScaling = false;
      this._store.rerender();
    }
  }

  handleWheel(event: WheelEvent): void {
    event.preventDefault();

    if (event.ctrlKey === true && KritzelEventHelper.isMainMouseWheel(event)) {
      this.handleZoom(event);
    }

    if (!event.ctrlKey) {
      this.handlePan(event);
    }
  }

  private handleZoom(event: WheelEvent): void {
    const rect = this._store.state.host.getBoundingClientRect();
    this._store.state.cursorX = event.clientX - rect.left;
    this._store.state.cursorY = event.clientY - rect.top;

    const delta = event.deltaY > 0 ? -this._store.state.scaleStep * this._store.state.scale : this._store.state.scaleStep * this._store.state.scale;
    const newScale = Math.min(this._store.state.scaleMax, Math.max(this._store.state.scaleMin, this._store.state.scale + delta));

    const scaleRatio = newScale / this._store.state.scale;
    const translateXAdjustment = (this._store.state.cursorX - this._store.state.translateX) * (scaleRatio - 1);
    const translateYAdjustment = (this._store.state.cursorY - this._store.state.translateY) * (scaleRatio - 1);

    this._store.state.scale = newScale;

    this._store.state.translateX -= translateXAdjustment;
    this._store.state.translateY -= translateYAdjustment;

    this._store.state.hasViewportChanged = true;
    this._store.rerender();
  }

  private handlePan(event: WheelEvent): void {
    const panSpeed = 0.8;

    const newTranslateX = this._store.state.translateX - event.deltaX * panSpeed;
    const newTranslateY = this._store.state.translateY - event.deltaY * panSpeed;

    this._store.state.translateX = Math.max(this._store.state.translateXMin, Math.min(this._store.state.translateXMax, newTranslateX));
    this._store.state.translateY = Math.max(this._store.state.translateYMin, Math.min(this._store.state.translateYMax, newTranslateY));

    this._store.state.hasViewportChanged = true;
    this._store.rerender();
  }
}
