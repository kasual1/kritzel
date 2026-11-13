import { UpdrawImage } from "../objects/image.class";
import { UpdrawLine } from "../objects/line.class";
import { UpdrawPath } from "../objects/path.class";
import { UpdrawShape } from "../objects/shape.class";
import { UpdrawSelectionGroup } from "../objects/selection-group.class";
import { UpdrawGroup } from "../objects/group.class";
import { UpdrawText } from "../objects/text.class";
import { UpdrawBrushTool } from "../tools/brush-tool.class";
import { UpdrawEraserTool } from "../tools/eraser-tool.class";
import { UpdrawImageTool } from "../tools/image-tool.class";
import { UpdrawLineTool } from "../tools/line-tool.class";
import { UpdrawSelectionTool } from "../tools/selection-tool.class";
import { UpdrawTextTool } from "../tools/text-tool.class";
import { UpdrawShapeTool } from "../tools/shape-tool.class";
import { UpdrawDynamicObject } from "../objects/dynamic-object.class";
import { UpdrawIframeObject } from "../objects/iframe.class";
import type { UpdrawCore } from "./core.class";
import { UpdrawWorkspace } from "./workspace.class";
import { normalizeLegacyClassName } from "../../migrations/legacy-brand";

/**
 * Handles deserialization/revival of Updraw objects from plain JavaScript objects.
 * This class uses a pattern similar to JSON.parse reviver to reconstruct class instances
 * from their serialized representations, preserving the object's prototype chain and methods.
 */
export class UpdrawReviver {

  /** Reference to the UpdrawCore instance for creating objects */
  private readonly _core: UpdrawCore;

  /**
   * Creates a new UpdrawReviver instance.
   * @param core - The UpdrawCore instance used to create revived objects
   */
  constructor(core: UpdrawCore) {
    this._core = core;
  }

  /**
   * Recursively revives a plain JavaScript object (or array) into typed Updraw instances.
   * Uses the `__class__` property to determine the correct class to instantiate.
   * Objects without `__class__` are recursively processed to revive nested objects.
   *
   * Supported classes:
   * - Objects: UpdrawPath, UpdrawLine, UpdrawText, UpdrawShape, UpdrawImage,
   *            UpdrawDynamicObject, UpdrawSelectionGroup, UpdrawGroup
   * - Workspace: UpdrawWorkspace
   * - Tools: UpdrawBrushTool, UpdrawEraserTool, UpdrawImageTool, UpdrawSelectionTool,
   *          UpdrawTextTool, UpdrawLineTool, UpdrawShapeTool
   *
   * @typeParam T - The expected return type after revival
   * @param obj - The plain object to revive, typically from JSON deserialization
   * @returns The revived object with proper class instances, or the original value if not an object
   */
  revive<T>(obj: any): T {
    if (obj && typeof obj === 'object') {
      if (obj.__class__) {
        let revivedObj;
        // Objects saved before the rename carry legacy class names (e.g. `KritzelPath`).
        // Revive them from a copy with the current name; never mutate the stored object.
        const className = normalizeLegacyClassName(obj.__class__);
        const data = className === obj.__class__ ? obj : { ...obj, __class__: className };

        switch (className) {
          case 'UpdrawPath':
            revivedObj = UpdrawPath.create(this._core).deserialize(data);
            break;
          case 'UpdrawLine':
            revivedObj = UpdrawLine.create(this._core).deserialize(data);
            break;
          case 'UpdrawText':
            revivedObj = UpdrawText.create(this._core, data.fontSize, data.fontFamily).deserialize(data);
            break;
          case 'UpdrawShape':
            revivedObj = UpdrawShape.create(this._core, {
              shapeType: data.shapeType,
              fillColor: data.fillColor,
              strokeColor: data.strokeColor,
              strokeWidth: data.strokeWidth,
              fontSize: data.fontSize,
              fontFamily: data.fontFamily,
              fontColor: data.fontColor,
            }).deserialize(data);
            break;
          case 'UpdrawImage':
            revivedObj = UpdrawImage.create(this._core).deserialize(data);
            break;
          case 'UpdrawDynamicObject':
            revivedObj = UpdrawDynamicObject.create(this._core).deserialize(data);
            break;
          case 'UpdrawIframeObject':
            revivedObj = UpdrawIframeObject.create(this._core).deserialize(data);
            break;
          case 'UpdrawSelectionGroup':
            revivedObj = UpdrawSelectionGroup.create(this._core).deserialize(data);
            break;
          case 'UpdrawGroup':
            revivedObj = UpdrawGroup.create(this._core).deserialize(data);
            break;
          case 'UpdrawWorkspace':
            revivedObj = UpdrawWorkspace.create(this._core, data).deserialize(data);
            break;
          case 'UpdrawBrushTool':
            revivedObj = new UpdrawBrushTool(this._core);
            break;
          case 'UpdrawEraserTool':
            revivedObj = new UpdrawEraserTool(this._core);
            break;
          case 'UpdrawImageTool':
            revivedObj = new UpdrawImageTool(this._core);
            break;
          case 'UpdrawSelectionTool':
            revivedObj = new UpdrawSelectionTool(this._core);
            break;
          case 'UpdrawTextTool':
            revivedObj = new UpdrawTextTool(this._core);
            break;
          case 'UpdrawLineTool':
            revivedObj = new UpdrawLineTool(this._core);
            break;
          case 'UpdrawShapeTool':
            revivedObj = new UpdrawShapeTool(this._core);
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