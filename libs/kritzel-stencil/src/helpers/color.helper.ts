export class KritzelColorHelper {
  /**
   * Applies opacity to a hex color and returns an rgba string.
   * @param hexColor - The hex color string (e.g., '#ff0000' or '#f00')
   * @param opacity - The opacity value between 0 and 1
   * @returns The color as an rgba string, or the original hex if opacity is 1
   */
  static applyOpacity(hexColor: string, opacity: number): string {
    if (opacity >= 1) return hexColor;

    const sanitizedHex = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor;
    let r: number, g: number, b: number;

    if (sanitizedHex.length === 3) {
      r = parseInt(sanitizedHex[0] + sanitizedHex[0], 16);
      g = parseInt(sanitizedHex[1] + sanitizedHex[1], 16);
      b = parseInt(sanitizedHex[2] + sanitizedHex[2], 16);
    } else if (sanitizedHex.length === 6) {
      r = parseInt(sanitizedHex.substring(0, 2), 16);
      g = parseInt(sanitizedHex.substring(2, 4), 16);
      b = parseInt(sanitizedHex.substring(4, 6), 16);
    } else {
      return hexColor;
    }

    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      return hexColor;
    }

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
}
