import { ThemeAwareColor, ThemeMode, resolveColor } from '../constants/color-palette.constants';
import { KritzelThemeManager } from '../classes/managers/theme.manager';

export class KritzelColorHelper {
  /**
   * Resolves a color value based on the current theme.
   * Handles both simple string colors and theme-aware color objects.
   * @param color - The color to resolve (string or ThemeAwareColor)
   * @param theme - Optional theme to use. If not provided, uses current theme from ThemeManager
   * @returns The resolved hex color string, or empty string if color is undefined
   */
  static resolveThemeColor(color: ThemeAwareColor | undefined, theme?: ThemeMode): string {
    if (!color) {
      return '';
    }
    
    const currentTheme = theme ?? KritzelThemeManager.getCurrentTheme();
    return resolveColor(color, currentTheme);
  }

  /**
   * Applies opacity to a theme-aware color and returns an rgba string.
   * @param color - The theme-aware color object
   * @param opacity - The opacity value between 0 and 1
   * @param theme - Optional theme to use. If not provided, uses current theme from ThemeManager
   * @returns The color as an rgba string, or the resolved hex if opacity is 1
   */
  static applyOpacity(color: ThemeAwareColor, opacity: number, theme?: ThemeMode): string {
    const hexColor = this.resolveThemeColor(color, theme);
    if (!hexColor || opacity >= 1) return hexColor;

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
