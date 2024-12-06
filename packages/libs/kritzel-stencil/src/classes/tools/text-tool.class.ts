import { KritzelTool } from "../../components";
import { kritzelEngineState } from "../../stores/engine.store";
import { kritzelViewportState } from "../../stores/viewport.store";
import { KrtizelText } from "../objects/text.class";

export class KritzelTextTool implements KritzelTool {
  name: string = 'text';
  icon: string = 'text';

  isWriting: boolean = false;

  handleMouseDown(_event: MouseEvent): void {
    // Do nothing
  }

  handleMouseMove(_event: MouseEvent): void {
    // Do nothing
  }

  handleMouseUp(event: MouseEvent): void {
    if (this.isWriting === false) {
      const { clientX, clientY } = event;
      const text = new KrtizelText();
      text.translateX = (clientX - kritzelViewportState.translateX) / kritzelViewportState.scale;
      text.translateY = (clientY - kritzelViewportState.translateY) / kritzelViewportState.scale;
      kritzelEngineState.objects = [...kritzelEngineState.objects, text];
      this.isWriting = true;
    }
  }
  handleWheel(_event: WheelEvent): void {
    // Do nothing
  }
}
