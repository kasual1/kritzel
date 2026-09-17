export class KritzelClassHelper {
  static isInstanceOf<T>(object: any, className: string): object is T {
    return !!object && object.__class__ === className;
  }
}