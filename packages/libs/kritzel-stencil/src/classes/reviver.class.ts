import { KritzelStore } from "../stores/store";
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

  store: KritzelStore;

  constructor(store: KritzelStore) {
    this.store = store;
  }
    
  revive(obj: any): any {
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
            revivedObj = new KritzelBrushTool(this.store);
            break;
          case 'KritzelEraserTool':
            revivedObj = new KritzelEraserTool(this.store);
            break;
          case 'KritzelImageTool':
            revivedObj = new KritzelImageTool(this.store);
            break;
          case 'KritzelSelectionTool':
            revivedObj = new KritzelSelectionTool(this.store);
            break;
          case 'KritzelTextTool':
            revivedObj = new KritzelTextTool(this.store);
            break;

          default:
            revivedObj = obj;
        }
        return revivedObj;
      }

      const newObj = Array.isArray(obj) ? [] : {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          newObj[key] = this.revive(obj[key]);
        }
      }
      return newObj;
    }
    return obj;
  }

}