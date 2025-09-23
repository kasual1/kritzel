import { KritzelMouseButton } from '../enums/event-button.enum';
import { KritzelEventHelper } from '../helpers/event.helper';
import { KritzelCore } from './core/core.class';

export class KritzelViewport {
  private readonly _core: KritzelCore;

  initialTouchDistance: number = 0;
  startX: number = 0;
  startY: number = 0;

  constructor(core: KritzelCore, host: HTMLElement) {
    this._core = core;
    this._core.state.host = host;
    this._core.state.viewportWidth = host.clientWidth;
    this._core.state.viewportHeight = host.clientHeight;
    this._core.state.startX = 0;
    this._core.state.startY = 0;
    this._core.state.translateX = 0;
    this._core.state.translateY = 0;
  }

  handleResize(): void {
    this._core.state.viewportWidth = this._core.state.host.clientWidth;
    this._core.state.viewportHeight = this._core.state.host.clientHeight;
    this._core.state.hasViewportChanged = true;
    this._core.rerender();
  }

  handlePointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      const adjustedClientX = event.clientX - this._core.store.offsetX;
      const adjustedClientY = event.clientY - this._core.store.offsetY;

      if (event.button === KritzelMouseButton.Right) {
        this._core.state.isPanning = true;
        this._core.state.startX = adjustedClientX;
        this._core.state.startY = adjustedClientY;
      }
    }

    if (event.pointerType === 'touch') {
      const activePointers = Array.from(this._core.state.pointers.values());

      if (activePointers.length === 2) {
        this._core.state.currentPath = null;
        this._core.state.isScaling = true;

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
      const hostRect = this._core.state.host.getBoundingClientRect();
      const xRelativeToHost = event.clientX - hostRect.left;
      const yRelativeToHost = event.clientY - hostRect.top;

      this._core.state.pointerX = (xRelativeToHost - this._core.state.translateX) / this._core.state.scale;
      this._core.state.pointerY = (yRelativeToHost - this._core.state.translateY) / this._core.state.scale;

      if (this._core.state.isPanning) {
        this._core.state.translateX -= this._core.state.startX - xRelativeToHost;
        this._core.state.translateY -= this._core.state.startY - yRelativeToHost;
        this._core.state.startX = xRelativeToHost;
        this._core.state.startY = yRelativeToHost;
        this._core.state.hasViewportChanged = true;
        this._core.state.skipContextMenu = true;

        this._core.rerender();
        this._core.updateWorkspaceViewport(this._core.state.translateX, this._core.state.translateY, this._core.state.scale);
      }
    }

    if (event.pointerType === 'touch') {
      const hostRect = this._core.state.host.getBoundingClientRect();
      const xRelativeToHost = event.clientX - hostRect.left;
      const yRelativeToHost = event.clientY - hostRect.top;

      this._core.state.pointerX = (xRelativeToHost - this._core.state.translateX) / this._core.state.scale;
      this._core.state.pointerY = (yRelativeToHost - this._core.state.translateY) / this._core.state.scale;

      const activePointers = Array.from(this._core.state.pointers.values());

      if (activePointers.length === 2) {
        const firstTouchX = activePointers[0].clientX - this._core.store.offsetX;
        const firstTouchY = activePointers[0].clientY - this._core.store.offsetY;

        const secondTouchX = activePointers[1].clientX - this._core.store.offsetX;
        const secondTouchY = activePointers[1].clientY - this._core.store.offsetY;

        const currentTouchDistance = Math.sqrt(Math.pow(firstTouchX - secondTouchX, 2) + Math.pow(firstTouchY - secondTouchY, 2));

        const midpointX = (firstTouchX + secondTouchX) / 2;
        const midpointY = (firstTouchY + secondTouchY) / 2;

        const scaleRatio = currentTouchDistance / this.initialTouchDistance!;
        const newScale = this._core.state.scale * scaleRatio;

        if (newScale > this._core.state.scaleMax || newScale < this._core.state.scaleMin) {
          this._core.state.translateX += midpointX - this.startX;
          this._core.state.translateY += midpointY - this.startY;
        } else {
          const translateXAdjustment = (midpointX - this._core.state.translateX) * (scaleRatio - 1);
          const translateYAdjustment = (midpointY - this._core.state.translateY) * (scaleRatio - 1);

          this._core.state.translateX += midpointX - this.startX - translateXAdjustment;
          this._core.state.translateY += midpointY - this.startY - translateYAdjustment;
          this._core.state.scale = newScale;

          this.initialTouchDistance = currentTouchDistance;
        }

        this.startX = midpointX;
        this.startY = midpointY;

        this._core.state.hasViewportChanged = true;

        this._core.rerender();
        this._core.updateWorkspaceViewport(this._core.state.translateX, this._core.state.translateY, this._core.state.scale);
      }
    }
  }

  handlePointerUp(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      if (this._core.state.isPanning) {
        this._core.state.isPanning = false;
        this._core.rerender();
      }
    }

    if (event.pointerType === 'touch') {
      this._core.state.isScaling = false;
      this._core.rerender();
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
    const rect = this._core.state.host.getBoundingClientRect();
    const xRelativeToHost = event.clientX - rect.left;
    const yRelativeToHost = event.clientY - rect.top;

    this._core.state.pointerX = (xRelativeToHost - this._core.state.translateX) / this._core.state.scale;
    this._core.state.pointerY = (yRelativeToHost - this._core.state.translateY) / this._core.state.scale;

    const delta = event.deltaY > 0 ? -this._core.state.scaleStep * this._core.state.scale : this._core.state.scaleStep * this._core.state.scale;
    const newScale = Math.min(this._core.state.scaleMax, Math.max(this._core.state.scaleMin, this._core.state.scale + delta));

    const scaleRatio = newScale / this._core.state.scale;
    const translateXAdjustment = (xRelativeToHost - this._core.state.translateX) * (scaleRatio - 1);
    const translateYAdjustment = (yRelativeToHost - this._core.state.translateY) * (scaleRatio - 1);

    this._core.state.scale = newScale;

    this._core.state.translateX -= translateXAdjustment;
    this._core.state.translateY -= translateYAdjustment;

    this._core.state.hasViewportChanged = true;

    this._core.rerender();
    this._core.updateWorkspaceViewport(this._core.state.translateX, this._core.state.translateY, this._core.state.scale);
  }

  private handlePan(event: WheelEvent): void {
    const panSpeed = 0.8;

    this._core.state.translateX -= event.deltaX * panSpeed;
    this._core.state.translateY -= event.deltaY * panSpeed;

    this._core.state.hasViewportChanged = true;

    this._core.rerender();
    this._core.updateWorkspaceViewport(this._core.state.translateX, this._core.state.translateY, this._core.state.scale);
  }
}
