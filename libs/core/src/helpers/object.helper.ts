import { UpdrawEmbeddedObject } from '../interfaces/embedded-object.interface';
import { UpdrawElementAwareObject } from '../interfaces/object-element.interface';

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

  static isClass<T>(object: unknown, className: string): object is T {
    return !!object && (object as { __class__?: string }).__class__ === className;
  }

  static isUpdrawEmbeddedObject(object: unknown): object is UpdrawEmbeddedObject {
    if (!object || typeof object !== 'object') {
      return false;
    }

    const candidate = object as Partial<UpdrawEmbeddedObject>;
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

  /** Whether an object's content elements can be picked, highlighted, queried and pointed at, see `UpdrawElementAwareObject`. */
  static isUpdrawElementAwareObject(object: unknown): object is UpdrawElementAwareObject {
    if (!object || typeof object !== 'object') {
      return false;
    }

    const candidate = object as Partial<UpdrawElementAwareObject>;
    return (
      typeof candidate.setElementPicking === 'function' &&
      typeof candidate.setElementHighlights === 'function' &&
      typeof candidate.getElementHighlights === 'function' &&
      typeof candidate.queryElements === 'function' &&
      typeof candidate.trackElement === 'function' &&
      typeof candidate.untrackElement === 'function' &&
      typeof candidate.getTrackedElementRect === 'function' &&
      typeof candidate.contentToObjectLocal === 'function' &&
      typeof candidate.refreshElementTheme === 'function'
    );
  }

  static isUpdrawExportable(object: unknown): object is { getSupportedExportFormats(): string[]; exportAs(format: string, context: unknown): Promise<string | null> } {
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
