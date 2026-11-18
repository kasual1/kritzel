import { UpmadeImage } from "../objects/image.class";
import { UpmadeLine } from "../objects/line.class";
import { UpmadePath } from "../objects/path.class";
import { UpmadeShape } from "../objects/shape.class";
import { UpmadeSelectionGroup } from "../objects/selection-group.class";
import { UpmadeGroup } from "../objects/group.class";
import { UpmadeText } from "../objects/text.class";
import { UpmadeBrushTool } from "../tools/brush-tool.class";
import { UpmadeEraserTool } from "../tools/eraser-tool.class";
import { UpmadeImageTool } from "../tools/image-tool.class";
import { UpmadeLineTool } from "../tools/line-tool.class";
import { UpmadeSelectionTool } from "../tools/selection-tool.class";
import { UpmadeTextTool } from "../tools/text-tool.class";
import { UpmadeShapeTool } from "../tools/shape-tool.class";
import { UpmadeDynamicObject } from "../objects/dynamic-object.class";
import { UpmadeIframeObject } from "../objects/iframe.class";
import type { UpmadeCore } from "./core.class";
import { UpmadeWorkspace } from "./workspace.class";
import { normalizeLegacyClassName } from "../../migrations/legacy-brand";

/**
 * Handles deserialization/revival of Upmade objects from plain JavaScript objects.
 * This class uses a pattern similar to JSON.parse reviver to reconstruct class instances
 * from their serialized representations, preserving the object's prototype chain and methods.
 */
export class UpmadeReviver {

  /** Reference to the UpmadeCore instance for creating objects */
  private readonly _core: UpmadeCore;

  /**
   * Creates a new UpmadeReviver instance.
   * @param core - The UpmadeCore instance used to create revived objects
   */
  constructor(core: UpmadeCore) {
    this._core = core;
  }

  /**
   * Recursively revives a plain JavaScript object (or array) into typed Upmade instances.
   * Uses the `__class__` property to determine the correct class to instantiate.
   * Objects without `__class__` are recursively processed to revive nested objects.
   *
   * Supported classes:
   * - Objects: UpmadePath, UpmadeLine, UpmadeText, UpmadeShape, UpmadeImage,
   *            UpmadeDynamicObject, UpmadeSelectionGroup, UpmadeGroup
   * - Workspace: UpmadeWorkspace
   * - Tools: UpmadeBrushTool, UpmadeEraserTool, UpmadeImageTool, UpmadeSelectionTool,
   *          UpmadeTextTool, UpmadeLineTool, UpmadeShapeTool
   *
   * @typeParam T - The expected return type after revival
   * @param obj - The plain object to revive, typically from JSON deserialization
   * @returns The revived object with proper class instances, or the original value if not an object
   */
  revive<T>(obj: any): T {
    if (obj && typeof obj === 'object') {
      if (obj.__class__) {
        let revivedObj;
        // Objects saved under a former name carry legacy class names, e.g. `UpdrawPath` (see migrations/legacy-brand.ts).
        // Revive them from a copy with the current name; never mutate the stored object.
        const className = normalizeLegacyClassName(obj.__class__);
        const data = className === obj.__class__ ? obj : { ...obj, __class__: className };

        switch (className) {
          case 'UpmadePath':
            revivedObj = UpmadePath.create(this._core).deserialize(data);
            break;
          case 'UpmadeLine':
            revivedObj = UpmadeLine.create(this._core).deserialize(data);
            break;
          case 'UpmadeText':
            revivedObj = UpmadeText.create(this._core, data.fontSize, data.fontFamily).deserialize(data);
            break;
          case 'UpmadeShape':
            revivedObj = UpmadeShape.create(this._core, {
              shapeType: data.shapeType,
              fillColor: data.fillColor,
              strokeColor: data.strokeColor,
              strokeWidth: data.strokeWidth,
              fontSize: data.fontSize,
              fontFamily: data.fontFamily,
              fontColor: data.fontColor,
            }).deserialize(data);
            break;
          case 'UpmadeImage':
            revivedObj = UpmadeImage.create(this._core).deserialize(data);
            break;
          case 'UpmadeDynamicObject':
            revivedObj = UpmadeDynamicObject.create(this._core).deserialize(data);
            break;
          case 'UpmadeIframeObject':
            revivedObj = UpmadeIframeObject.create(this._core).deserialize(data);
            break;
          case 'UpmadeSelectionGroup':
            revivedObj = UpmadeSelectionGroup.create(this._core).deserialize(data);
            break;
          case 'UpmadeGroup':
            revivedObj = UpmadeGroup.create(this._core).deserialize(data);
            break;
          case 'UpmadeWorkspace':
            revivedObj = UpmadeWorkspace.create(this._core, data).deserialize(data);
            break;
          case 'UpmadeBrushTool':
            revivedObj = new UpmadeBrushTool(this._core);
            break;
          case 'UpmadeEraserTool':
            revivedObj = new UpmadeEraserTool(this._core);
            break;
          case 'UpmadeImageTool':
            revivedObj = new UpmadeImageTool(this._core);
            break;
          case 'UpmadeSelectionTool':
            revivedObj = new UpmadeSelectionTool(this._core);
            break;
          case 'UpmadeTextTool':
            revivedObj = new UpmadeTextTool(this._core);
            break;
          case 'UpmadeLineTool':
            revivedObj = new UpmadeLineTool(this._core);
            break;
          case 'UpmadeShapeTool':
            revivedObj = new UpmadeShapeTool(this._core);
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