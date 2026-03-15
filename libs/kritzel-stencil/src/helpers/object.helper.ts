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
}
