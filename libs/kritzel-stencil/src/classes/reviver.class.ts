import { KritzelStore } from "./store.class";
import { KritzelImage } from "./objects/image.class";
import { KritzelPath } from "./objects/path.class";
import { KritzelSelectionGroup } from "./objects/selection-group.class";
import { KritzelText } from "./objects/text.class";
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
    
  revive<T>(obj: any): T {
    if (obj && typeof obj === 'object') {
      if (obj.__class__) {
        let revivedObj;
        
        switch (obj.__class__) {
          case 'KritzelPath':
            revivedObj = KritzelPath.create(this._store).revive(obj);
            break;
          case 'KritzelText':
            revivedObj = KritzelText.create(this._store, obj.fontSize, obj.fontFamily).revive(obj);
            break;
          case 'KritzelImage':
            revivedObj = KritzelImage.create(this._store).revive(obj);
            break;
          case 'KritzelSelectionGroup':
            revivedObj = KritzelSelectionGroup.create(this._store).revive(obj);
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
      return newObj as T;
    }
    return obj;
  }

}