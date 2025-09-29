export class ObjectHelper {
  static generateUUID(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  static isEmpty(obj: any): boolean {
    if (obj === null || obj === undefined) {
      return true;
    }
    return Object?.keys(obj).length === 0 && obj?.constructor === Object;
  }
}
