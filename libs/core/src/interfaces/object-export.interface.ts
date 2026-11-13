import { UpdrawBaseObject } from '../classes/objects/base-object.class';

export type UpdrawObjectExportFormat = 'png' | 'svg';

/**
 * Runtime context passed to object-owned export methods.
 * The engine provides these callbacks so object classes can request
 * serialization/rasterization without owning global dependencies.
 */
export interface UpdrawObjectExportContext {
  getObjectAsSvgDataUrl(object: UpdrawBaseObject, options?: { rasterSafeForCanvas?: boolean }): Promise<string | null>;
  getObjectAsPngDataUrl(object: UpdrawBaseObject): Promise<string | null>;
}

/**
 * Capability contract for objects that can export themselves.
 */
export interface UpdrawExportable {
  getSupportedExportFormats(): UpdrawObjectExportFormat[];
  exportAs(format: UpdrawObjectExportFormat, context: UpdrawObjectExportContext): Promise<string | null>;
}
