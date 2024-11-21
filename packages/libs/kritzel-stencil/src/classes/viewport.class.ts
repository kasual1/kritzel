import { KritzelClickHelper } from "../helpers/click.helper";
import { kritzelEngineState } from "../stores/engine.store";
import { KritzelViewportState, kritzelViewportState } from "../stores/viewport.store";

export class KritzelViewport {

  host: HTMLElement;

  state: KritzelViewportState;

  isDragging: boolean = false;

  constructor(host: HTMLElement){
    this.host = host;
    this.state = kritzelViewportState;
  }

  updateObjectsVisibility() {
    const padding = 25;

    kritzelEngineState.paths?.forEach(path => {
      path.visible = path.isInViewport(
        {
          x: (-this.state.translateX - padding) / this.state.scale,
          y: (-this.state.translateY - padding) / this.state.scale,
          width: (window.innerWidth + 2 * padding) / this.state.scale,
          height: (window.innerHeight + 2 * padding) / this.state.scale,
        },
        this.state.scale,
      );
    });
  }

  handleMouseDown(event: MouseEvent): void{
    if (KritzelClickHelper.isRightClick(event)) {
      this.isDragging = true;
      this.state.startX = event.clientX;
      this.state.startY = event.clientY;
    }
  }

  handleMouseMove(event: MouseEvent): void{
    if (this.isDragging) {
      this.state.translateX -= this.state.startX - event.clientX;
      this.state.translateY -= this.state.startY - event.clientY;
      this.state.startX = event.clientX;
      this.state.startY = event.clientY;
    }
  }

  handleMouseUp(_event: MouseEvent): void{
    if (this.isDragging) {
      this.isDragging = false;
    }
  }

  handleWheel(event: WheelEvent): void{
    event.preventDefault();

    const rect = this.host.getBoundingClientRect();
    this.state.cursorX = event.clientX - rect.left;
    this.state.cursorY = event.clientY - rect.top;

    const delta = event.deltaY > 0 ? -this.state.scaleStep * this.state.scale : this.state.scaleStep * this.state.scale;
    const newScale = Math.min(this.state.scaleMax, Math.max(this.state.scaleMin, this.state.scale + delta));

    const scaleRatio = newScale / this.state.scale;
    const translateXAdjustment = (this.state.cursorX - this.state.translateX) * (scaleRatio - 1);
    const translateYAdjustment = (this.state.cursorY - this.state.translateY) * (scaleRatio - 1);

    this.state.scale = newScale;

    this.state.translateX -= translateXAdjustment;
    this.state.translateY -= translateYAdjustment;
  }

}
