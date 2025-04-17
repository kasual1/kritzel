import { KritzelClickHelper } from '../helpers/click.helper';
import { KritzelStore } from './store.class';

export class KritzelViewport {
  private readonly _store: KritzelStore;

  isDragging: boolean = false;

  currentTouchEventLength: number = 0;
  initialTouchDistance: number = 0;
  startX: number = 0;
  startY: number = 0;

  constructor(store: KritzelStore, host: HTMLElement) {
    this._store = store;
    this._store.state.host = host;
    this._store.state.host.setAttribute('tabindex', '0');
    this._store.state.viewportWidth = host.clientWidth;
    this._store.state.viewportHeight = host.clientHeight;
    this._store.state.startX = 0;
    this._store.state.startY = 0;
    this._store.state.translateX = 0;
    this._store.state.translateY = 0;
  }

  handleMouseDown(event: MouseEvent): void {
    const adjustedClientX = event.clientX - this._store.offsetX;
    const adjustedClientY = event.clientY - this._store.offsetY;

    if (KritzelClickHelper.isRightClick(event)) {
      this.isDragging = true;
      this._store.state.startX = adjustedClientX;
      this._store.state.startY = adjustedClientY;
    }
  }

  handleMouseMove(event: MouseEvent): void {
    const adjustedClientX = event.clientX - this._store.offsetX;
    const adjustedClientY = event.clientY - this._store.offsetY;

    this._store.state.cursorX = adjustedClientX;
    this._store.state.cursorY = adjustedClientY;

    if (this.isDragging) {
      this._store.state.translateX -= this._store.state.startX - adjustedClientX;
      this._store.state.translateY -= this._store.state.startY - adjustedClientY;
      this._store.state.startX = adjustedClientX;
      this._store.state.startY = adjustedClientY;
      this._store.state.hasViewportChanged = true;
      this._store.rerender();
    }
  }

  handleMouseUp(_event: MouseEvent): void {
    if (this.isDragging) {
      this.isDragging = false;
    }
  }

  handleTouchStart(event: TouchEvent): void {
    this.currentTouchEventLength = event.touches.length;

    if (this.currentTouchEventLength === 2) {
      this._store.state.currentPath = null;

      const firstTouchX = event.touches[0].clientX - this._store.offsetX;
      const firstTouchY = event.touches[0].clientY - this._store.offsetY;

      const secondTouchX = event.touches[1].clientX - this._store.offsetX;
      const secondTouchY = event.touches[1].clientY - this._store.offsetY;

      this.initialTouchDistance = Math.sqrt(
          Math.pow(firstTouchX - secondTouchX, 2) +
          Math.pow(firstTouchY - secondTouchY, 2)
      );

      this.startX = (firstTouchX + secondTouchX) / 2;
      this.startY = (firstTouchY + secondTouchY) / 2;
    }

  }

  handleTouchMove(event: TouchEvent): void {
    console.log('touch move');

    if (this.currentTouchEventLength === 2) {

      const firstTouchX = event.touches[0].clientX - this._store.offsetX;
      const firstTouchY = event.touches[0].clientY - this._store.offsetY;

      const secondTouchX = event.touches[1].clientX - this._store.offsetX;
      const secondTouchY = event.touches[1].clientY - this._store.offsetY;

      const currentTouchDistance = Math.sqrt(
        Math.pow(firstTouchX - secondTouchX, 2) +
          Math.pow(firstTouchY - secondTouchY, 2)
      );

      const midpointX =
        (firstTouchX + secondTouchX) / 2;
      const midpointY =
        (firstTouchY + secondTouchY) / 2;

      const scaleRatio = currentTouchDistance / this.initialTouchDistance!;
      const newScale = this._store.state.scale * scaleRatio;

      if (newScale > this._store.state.scaleMax || newScale < this._store.state.scaleMin) {
        this._store.state.translateX += midpointX - this.startX;
        this._store.state.translateY += midpointY - this.startY;
      } else {
        const translateXAdjustment =
          (midpointX - this._store.state.translateX) * (scaleRatio - 1);
        const translateYAdjustment =
          (midpointY - this._store.state.translateY) * (scaleRatio - 1);

        this._store.state.translateX += midpointX - this.startX - translateXAdjustment;
        this._store.state.translateY += midpointY - this.startY - translateYAdjustment;
        this._store.state.scale = newScale;

        this.initialTouchDistance = currentTouchDistance;
      }

      this.startX = midpointX;
      this.startY = midpointY;
    }

  }

  handleTouchEnd(_event: TouchEvent): void {
    this.currentTouchEventLength = 0;
  }

  handleWheel(event: WheelEvent): void {
    event.preventDefault();

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

  handleResize(): void {
    this._store.state.viewportWidth = this._store.state.host.clientWidth;
    this._store.state.viewportHeight = this._store.state.host.clientHeight;
    this._store.state.hasViewportChanged = true;
    this._store.rerender();
  }
 
}
