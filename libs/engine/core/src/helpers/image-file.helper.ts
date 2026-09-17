
export class KritzelImageFileHelper {
  static isGifFile(file: Pick<File, 'name' | 'type'>): boolean {
    const mimeType = file.type.trim().toLowerCase();
    return mimeType === 'image/gif' || (mimeType === '' && file.name.toLowerCase().endsWith('.gif'));
  }
}