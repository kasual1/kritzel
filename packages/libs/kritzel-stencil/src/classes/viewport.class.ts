import { KritzelClickHelper } from '../helpers/click.helper';
import { KritzelStore } from './store.class';

export class KritzelViewport {
  private readonly _store: KritzelStore;

  isDragging: boolean = false;

  constructor(store: KritzelStore, host: HTMLElement) {
    this._store = store;
    this._store.state.host = host;
  }

  handleMouseDown(event: MouseEvent): void {
    if (KritzelClickHelper.isRightClick(event)) {
      this.isDragging = true;
      this._store.state.startX = event.clientX;
      this._store.state.startY = event.clientY;
    }
  }

  handleMouseMove(event: MouseEvent): void {
    this._store.state.cursorX = event.clientX;
    this._store.state.cursorY = event.clientY;

    if (this.isDragging) {
      this._store.state.translateX -= this._store.state.startX - event.clientX;
      this._store.state.translateY -= this._store.state.startY - event.clientY;
      this._store.state.startX = event.clientX;
      this._store.state.startY = event.clientY;
      this._store.state.hasViewportChanged = true;
      this._store.rerender();
    }
  }

  handleMouseUp(_event: MouseEvent): void {
    if (this.isDragging) {
      this.isDragging = false;
    }
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
    this._store.state.viewportWidth = window.innerWidth;
    this._store.state.viewportHeight = window.innerHeight;
    this._store.state.hasViewportChanged = true;
    this._store.rerender();
  }
}
