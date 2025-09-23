import { KritzelImage } from "../objects/image.class";
import { KritzelPath } from "../objects/path.class";
import { KritzelSelectionGroup } from "../objects/selection-group.class";
import { KritzelText } from "../objects/text.class";
import { KritzelBrushTool } from "../tools/brush-tool.class";
import { KritzelEraserTool } from "../tools/eraser-tool.class";
import { KritzelImageTool } from "../tools/image-tool.class";
import { KritzelSelectionTool } from "../tools/selection-tool.class";
import { KritzelTextTool } from "../tools/text-tool.class";
import { KritzelCustomElement } from "../objects/custom-element.class";
import { KritzelCore } from "./core.class";

export class KritzelReviver {

  private readonly _core: KritzelCore;

  constructor(core: KritzelCore) {
    this._core = core;
  }
    
  revive<T>(obj: any): T {
    if (obj && typeof obj === 'object') {
      if (obj.__class__) {
        let revivedObj;
        
        switch (obj.__class__) {
          case 'KritzelPath':
            revivedObj = KritzelPath.create(this._core).revive(obj);
            break;
          case 'KritzelText':
            revivedObj = KritzelText.create(this._core, obj.fontSize, obj.fontFamily).revive(obj);
            break;
          case 'KritzelImage':
            revivedObj = KritzelImage.create(this._core).revive(obj);
            break;
          case 'KritzelCustomElement':
            revivedObj = KritzelCustomElement.create(this._core).revive(obj);
            break;
          case 'KritzelSelectionGroup':
            revivedObj = KritzelSelectionGroup.create(this._core).revive(obj);
            break;
          case 'KritzelBrushTool':
            revivedObj = new KritzelBrushTool(this._core);
            break;
          case 'KritzelEraserTool':
            revivedObj = new KritzelEraserTool(this._core);
            break;
          case 'KritzelImageTool':
            revivedObj = new KritzelImageTool(this._core);
            break;
          case 'KritzelSelectionTool':
            revivedObj = new KritzelSelectionTool(this._core);
            break;
          case 'KritzelTextTool':
            revivedObj = new KritzelTextTool(this._core);
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