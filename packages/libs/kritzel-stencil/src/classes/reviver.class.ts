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

  private readonly _store: KritzelStore;

  constructor(store: KritzelStore) {
    this._store = store;
  }
    
  revive(obj: any): any {
    if (obj && typeof obj === 'object') {
      if (obj.__class__) {
        let revivedObj;
        switch (obj.__class__) {
          case 'KritzelPath':
            revivedObj = new KritzelPath(this._store).revive(obj);
            break;
          case 'KritzelText':
            revivedObj = new KrtizelText(this._store).revive(obj);
            break;
          case 'KritzelImage':
            revivedObj = new KritzelImage(this._store).revive(obj);
            break;
          case 'KritzelSelectionGroup':
            revivedObj = new KritzelSelectionGroup(this._store).revive(obj);
            break;
          case 'KritzelBrushTool':
            revivedObj = new KritzelBrushTool(this._store);
            break;
          case 'KritzelEraserTool':
            revivedObj = new KritzelEraserTool(this._store);
            break;
          case 'KritzelImageTool':
            revivedObj = new KritzelImageTool(this._store);
            break;
          case 'KritzelSelectionTool':
            revivedObj = new KritzelSelectionTool(this._store);
            break;
          case 'KritzelTextTool':
            revivedObj = new KritzelTextTool(this._store);
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