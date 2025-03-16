import { KritzelImage } from "./objects/image.class";
import { KritzelPath } from "./objects/path.class";
import { KritzelSelectionGroup } from "./objects/selection-group.class";
import { KrtizelText } from "./objects/text.class";
import { KritzelBrushTool } from "./tools/brush-tool.class";
import { KritzelEraserTool } from "./tools/eraser-tool.class";
import { KritzelImageTool } from "./tools/image-tool.class";
import { KritzelSelectionTool } from "./tools/selection-tool.class";
import { KritzelTextTool } from "./tools/text-tool.class";

export class KritzelReviver {
    
  static revive(obj: any): any {
    if (obj && typeof obj === 'object') {
      if (obj.__class__) {
        let revivedObj;
        switch (obj.__class__) {
          case 'KritzelPath':
            revivedObj = new KritzelPath().revive(obj);
            break;
          case 'KritzelText':
            revivedObj = new KrtizelText().revive(obj);
            break;
          case 'KritzelImage':
            revivedObj = new KritzelImage().revive(obj);
            break;
          case 'KritzelSelectionGroup':
            revivedObj = new KritzelSelectionGroup().revive(obj);
            break;
          case 'KritzelBrushTool':
            revivedObj = new KritzelBrushTool();
            break;
          case 'KritzelEraserTool':
            revivedObj = new KritzelEraserTool();
            break;
          case 'KritzelImageTool':
            revivedObj = new KritzelImageTool();
            break;
          case 'KritzelSelectionTool':
            revivedObj = new KritzelSelectionTool();
            break;
          case 'KritzelTextTool':
            revivedObj = new KritzelTextTool();
            break;

          default:
            revivedObj = obj;
        }
        return revivedObj;
      }

      const newObj = Array.isArray(obj) ? [] : {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          newObj[key] = KritzelReviver.revive(obj[key]);
        }
      }
      return newObj;
    }
    return obj;
  }

}