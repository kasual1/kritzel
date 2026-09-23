import { KritzelImage } from "../objects/image.class";
import { KritzelLine } from "../objects/line.class";
import { KritzelPath } from "../objects/path.class";
import { KritzelShape } from "../objects/shape.class";
import { KritzelSelectionGroup } from "../objects/selection-group.class";
import { KritzelGroup } from "../objects/group.class";
import { KritzelText } from "../objects/text.class";
import { KritzelBrushTool } from "../tools/brush-tool.class";
import { KritzelEraserTool } from "../tools/eraser-tool.class";
import { KritzelImageTool } from "../tools/image-tool.class";
import { KritzelLineTool } from "../tools/line-tool.class";
import { KritzelSelectionTool } from "../tools/selection-tool.class";
import { KritzelTextTool } from "../tools/text-tool.class";
import { KritzelShapeTool } from "../tools/shape-tool.class";
import { KritzelDynamicObject } from "../objects/dynamic-object.class";
import { KritzelIframeObject } from "../objects/iframe.class";
import type { KritzelCore } from "./core.class";
import { KritzelWorkspace } from "./workspace.class";

/**
 * Handles deserialization/revival of Kritzel objects from plain JavaScript objects.
 * This class uses a pattern similar to JSON.parse reviver to reconstruct class instances
 * from their serialized representations, preserving the object's prototype chain and methods.
 */
export class KritzelReviver {

  /** Reference to the KritzelCore instance for creating objects */
  private readonly _core: KritzelCore;

  /**
   * Creates a new KritzelReviver instance.
   * @param core - The KritzelCore instance used to create revived objects
   */
  constructor(core: KritzelCore) {
    this._core = core;
  }

  /**
   * Recursively revives a plain JavaScript object (or array) into typed Kritzel instances.
   * Uses the `__class__` property to determine the correct class to instantiate.
   * Objects without `__class__` are recursively processed to revive nested objects.
   *
   * Supported classes:
   * - Objects: KritzelPath, KritzelLine, KritzelText, KritzelShape, KritzelImage,
   *            KritzelDynamicObject, KritzelSelectionGroup, KritzelGroup
   * - Workspace: KritzelWorkspace
   * - Tools: KritzelBrushTool, KritzelEraserTool, KritzelImageTool, KritzelSelectionTool,
   *          KritzelTextTool, KritzelLineTool, KritzelShapeTool
   *
   * @typeParam T - The expected return type after revival
   * @param obj - The plain object to revive, typically from JSON deserialization
   * @returns The revived object with proper class instances, or the original value if not an object
   */
  revive<T>(obj: any): T {
    if (obj && typeof obj === 'object') {
      if (obj.__class__) {
        let revivedObj;

        switch (obj.__class__) {
          case 'KritzelPath':
            revivedObj = KritzelPath.create(this._core).deserialize(obj);
            break;
          case 'KritzelLine':
            revivedObj = KritzelLine.create(this._core).deserialize(obj);
            break;
          case 'KritzelText':
            revivedObj = KritzelText.create(this._core, obj.fontSize, obj.fontFamily).deserialize(obj);
            break;
          case 'KritzelShape':
            revivedObj = KritzelShape.create(this._core, {
              shapeType: obj.shapeType,
              fillColor: obj.fillColor,
              strokeColor: obj.strokeColor,
              strokeWidth: obj.strokeWidth,
              fontSize: obj.fontSize,
              fontFamily: obj.fontFamily,
              fontColor: obj.fontColor,
            }).deserialize(obj);
            break;
          case 'KritzelImage':
            revivedObj = KritzelImage.create(this._core).deserialize(obj);
            break;
          case 'KritzelDynamicObject':
            revivedObj = KritzelDynamicObject.create(this._core).deserialize(obj);
            break;
          case 'KritzelIframeObject':
            revivedObj = KritzelIframeObject.create(this._core).deserialize(obj);
            break;
          case 'KritzelSelectionGroup':
            revivedObj = KritzelSelectionGroup.create(this._core).deserialize(obj);
            break;
          case 'KritzelGroup':
            revivedObj = KritzelGroup.create(this._core).deserialize(obj);
            break;
          case 'KritzelWorkspace':
            revivedObj = KritzelWorkspace.create(this._core, obj).deserialize(obj);
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
          case 'KritzelLineTool':
            revivedObj = new KritzelLineTool(this._core);
            break;
          case 'KritzelShapeTool':
            revivedObj = new KritzelShapeTool(this._core);
            break;

          default:
            revivedObj = obj;
        }
        return revivedObj;
      }

      const newObj: any = Array.isArray(obj) ? [] : {};
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