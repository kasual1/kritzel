import { KritzelClickHelper } from '../helpers/click.helper';
import { KritzelStore } from './store.class';

export class KritzelViewport {
  private readonly _store: KritzelStore;

  isDragging: boolean = false;

  offsetX: number = 0;

  offsetY: number = 0;

  constructor(store: KritzelStore, host: HTMLElement) {

    this.offsetX = host.getBoundingClientRect().left;
    this.offsetY = host.getBoundingClientRect().top;

    this._store = store;
    this._store.state.host = host;
    this._store.state.viewportWidth = host.clientWidth;
    this._store.state.viewportHeight = host.clientHeight;
    this._store.state.startX = 0;
    this._store.state.startY = 0;
    this._store.state.translateX = -this.offsetX;
    this._store.state.translateY = -this.offsetY;
  }

  handleMouseDown(event: MouseEvent): void {
    const adjustedClientX = event.clientX - this.offsetX;
    const adjustedClientY = event.clientY - this.offsetY;
    
    if (KritzelClickHelper.isRightClick(event)) {
      this.isDragging = true;
      this._store.state.startX = adjustedClientX;
      this._store.state.startY = adjustedClientY;
    }
  }

  handleMouseMove(event: MouseEvent): void {
    const adjustedClientX = event.clientX - this.offsetX;
    const adjustedClientY = event.clientY - this.offsetY;

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

  handleWheel(event: WheelEvent): void {
    event.preventDefault();

    const adjustedClientX = event.clientX - this.offsetX;
    const adjustedClientY = event.clientY - this.offsetY;

    const rect = this._store.state.host.getBoundingClientRect();
    this._store.state.cursorX = adjustedClientX- rect.left;
    this._store.state.cursorY = adjustedClientY - rect.top;

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
