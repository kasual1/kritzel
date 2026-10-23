import { KritzelEmbeddedObject } from '../interfaces/embedded-object.interface';
import type { KritzelObjectCommonConfig } from '../interfaces/object.interface';

export class ObjectHelper {
  static generateUUID(length: number = 16): string {
    const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const bytes = crypto.getRandomValues(new Uint8Array(length));

    return Array.from(bytes)
      .map(byte => alphabet[byte % alphabet.length])
      .join('');
  }

  static isEmpty(obj: any): boolean {
    if (obj === null || obj === undefined) {
      return true;
    }
    return Object?.keys(obj).length === 0 && obj?.constructor === Object;
  }

  /**
   * Applies the options shared by all object configs to a newly constructed object.
   * Kept off the object classes on purpose: a non-public class member would break the
   * structural typing of objects unwrapped by Vue's `ref()`.
   * @param object - The object being constructed
   * @param config - The object config passed to its constructor
   */
  static applyCommonConfig(object: KritzelObjectCommonConfig, config?: KritzelObjectCommonConfig): void {
    if (config?.name !== undefined) {
      object.name = config.name;
    }
  }

  static isClass<T>(object: unknown, className: string): object is T {
    return !!object && (object as { __class__?: string }).__class__ === className;
  }

  static isKritzelEmbeddedObject(object: unknown): object is KritzelEmbeddedObject {
    if (!object || typeof object !== 'object') {
      return false;
    }

    const candidate = object as Partial<KritzelEmbeddedObject>;
    return (
      typeof candidate.isInteractive === 'boolean' &&
      typeof candidate.isSelected === 'boolean' &&
      typeof candidate.mount === 'function' &&
      typeof candidate.unmount === 'function' &&
      typeof candidate.setIsInteractive === 'function' &&
      typeof candidate.hasFocusedInputElement === 'function' &&
      typeof candidate.getEmbeddedContentRoots === 'function'
    );
  }

  static isKritzelExportable(object: unknown): object is { getSupportedExportFormats(): string[]; exportAs(format: string, context: unknown): Promise<string | null> } {
    if (!object || typeof object !== 'object') {
      return false;
    }

    const candidate = object as {
      getSupportedExportFormats?: () => unknown;
      exportAs?: (format: unknown, context: unknown) => unknown;
    };

    if (typeof candidate.getSupportedExportFormats !== 'function' || typeof candidate.exportAs !== 'function') {
      return false;
    }

    const formats = candidate.getSupportedExportFormats();
    return Array.isArray(formats) && formats.length > 0;
  }
}
