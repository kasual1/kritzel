import { ThemeAwareColor, resolveColor } from '../constants/color-palette.constants';
import { ThemeName } from '../interfaces/theme.interface';
import { KritzelThemeManager } from '../classes/managers/theme.manager';

export class KritzelColorHelper {
  /**
   * Resolves a color value based on the current theme.
   * Handles both simple string colors and theme-aware color objects.
   * @param color - The color to resolve (string or ThemeAwareColor)
   * @param theme - Optional theme to use. If not provided, uses current theme from ThemeManager
   * @returns The resolved hex color string, or empty string if color is undefined
   */
  static resolveThemeColor(color: ThemeAwareColor | undefined, theme?: ThemeName): string {
    if (!color) {
      return '';
    }
    
    const currentTheme = theme ?? KritzelThemeManager.getStoredTheme();
    return resolveColor(color, currentTheme as ThemeName);
  }

  /**
   * Applies opacity to a theme-aware color and returns an rgba string.
   * @param color - The theme-aware color object or a hex color string
   * @param opacity - The opacity value between 0 and 1
   * @param theme - Optional theme to use. If not provided, uses current theme from ThemeManager
   * @returns The color as an rgba string, or the resolved hex if opacity is 1
   */
  static applyOpacity(color: ThemeAwareColor | string | undefined, opacity: number, theme?: ThemeName): string {
    const hexColor = typeof color === 'string' ? color : this.resolveThemeColor(color, theme);
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

  /**
   * Determines the appropriate contrast color (black or white) based on the luminance of the given hex color.
   * Uses the relative luminance formula: 0.299*R + 0.587*G + 0.114*B
   * @param hexColor - The hex color string (with or without #)
   * @returns '#000000' for light backgrounds, '#ffffff' for dark backgrounds
   */
  static getContrastColor(hexColor: string): string {
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
      // Default to black for invalid colors
      return '#000000';
    }

    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      return '#000000';
    }

    // Calculate relative luminance
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    
    // Use threshold of 150 (midpoint) for balanced contrast
    return luminance > 150 ? '#000000' : '#ffffff';
  }

  /**
   * Determines the appropriate text color for both light and dark themes based on the fill color.
   * Returns default theme-appropriate colors if the fill is transparent.
   * @param fillColor - The theme-aware fill color
   * @returns A theme-aware color object with appropriate text colors for both themes
   */
  static determineTextColor(fillColor: ThemeAwareColor): ThemeAwareColor {
    // Check if fillColor is transparent for both themes
    const isTransparentLight = fillColor.light === 'transparent';
    const isTransparentDark = fillColor.dark === 'transparent';

    if (isTransparentLight && isTransparentDark) {
      // Return default theme-appropriate colors for transparent fills
      return { light: '#000000', dark: '#ffffff' };
    }

    // Determine text color for each theme based on fill brightness
    const lightThemeTextColor = isTransparentLight 
      ? '#000000' 
      : this.getContrastColor(fillColor.light);
    
    const darkThemeTextColor = isTransparentDark 
      ? '#ffffff' 
      : this.getContrastColor(fillColor.dark);

    return {
      light: lightThemeTextColor,
      dark: darkThemeTextColor,
    };
  }
}
