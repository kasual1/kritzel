import { KritzelBaseObject } from '../classes/objects/base-object.class';

export type KritzelObjectExportFormat = 'png' | 'svg';

/**
 * Runtime context passed to object-owned export methods.
 * The engine provides these callbacks so object classes can request
 * serialization/rasterization without owning global dependencies.
 */
export interface KritzelObjectExportContext {
  getObjectAsSvgDataUrl(object: KritzelBaseObject, options?: { rasterSafeForCanvas?: boolean }): Promise<string | null>;
  getObjectAsPngDataUrl(object: KritzelBaseObject): Promise<string | null>;
}

/**
 * Capability contract for objects that can export themselves.
 */
export interface KritzelExportable {
  getSupportedExportFormats(): KritzelObjectExportFormat[];
  exportAs(format: KritzelObjectExportFormat, context: KritzelObjectExportContext): Promise<string | null>;
}
