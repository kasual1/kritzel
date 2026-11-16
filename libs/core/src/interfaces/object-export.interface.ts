import { UpmadeBaseObject } from '../classes/objects/base-object.class';

export type UpmadeObjectExportFormat = 'png' | 'svg';

/**
 * Runtime context passed to object-owned export methods.
 * The engine provides these callbacks so object classes can request
 * serialization/rasterization without owning global dependencies.
 */
export interface UpmadeObjectExportContext {
  getObjectAsSvgDataUrl(object: UpmadeBaseObject, options?: { rasterSafeForCanvas?: boolean }): Promise<string | null>;
  getObjectAsPngDataUrl(object: UpmadeBaseObject): Promise<string | null>;
}

/**
 * Capability contract for objects that can export themselves.
 */
export interface UpmadeExportable {
  getSupportedExportFormats(): UpmadeObjectExportFormat[];
  exportAs(format: UpmadeObjectExportFormat, context: UpmadeObjectExportContext): Promise<string | null>;
}
