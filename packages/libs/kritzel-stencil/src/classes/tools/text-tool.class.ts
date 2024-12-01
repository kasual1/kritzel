import { KritzelTool } from "../../components";
import { kritzelEngineState } from "../../stores/engine.store";
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
      text.translateX = clientX;
      text.translateY = clientY;
      text.width = 100;
      text.height = 100;
      kritzelEngineState.objects = [...kritzelEngineState.objects, text];
      this.isWriting = true;
    }
  }

  handleWheel(_event: WheelEvent): void {
    // Do nothing
  }
}
