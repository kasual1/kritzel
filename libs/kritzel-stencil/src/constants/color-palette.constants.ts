import { ThemeName } from '../interfaces/theme.interface';

/**
 * Supported theme modes for color variations
 */
// export type ThemeMode = 'light' | 'dark'; // Removed in favor of ThemeName

/**
 * Color definition with different values per theme
 */
export interface ThemeAwareColor {
  /** Color value for light theme */
  light: string;
  /** Color value for dark theme */
  dark: string;
  /** Custom colors based on new themes */
  [key: string]: string | undefined;
  /** Optional semantic label for the color */
  label?: string;
}

/**
 * Type for a color palette with theme-aware colors only
 */
export type ColorPalette = readonly ThemeAwareColor[];

/**
 * Helper function to resolve a color value for a specific theme
 */
export function resolveColor(color: ThemeAwareColor, theme: ThemeName): string {
  if (theme in color && color[theme]) {
    return color[theme] as string;
  }
  return color[theme === 'dark' ? 'dark' : 'light'];
}

/**
 * Default color palette shared across all tool configurations.
 * This ensures consistency in color options throughout the application.
 * All colors support theme-specific variations.
 */
export const DEFAULT_COLOR_PALETTE: ColorPalette = [
  { light: '#000000', dark: '#ffffff', label: 'Primary' },
  { light: '#ff5252', dark: '#ff5252' },
  { light: '#ffbc00', dark: '#ffbc00' },
  { light: '#00c853', dark: '#00c853' },
  { light: '#0000FF', dark: '#0000FF' },
  { light: '#d500f9', dark: '#d500f9' },
  { light: '#fafafa', dark: '#212121', label: 'Background' },
  { light: '#a52714', dark: '#a52714' },
  { light: '#ee8100', dark: '#ee8100' },
  { light: '#558b2f', dark: '#558b2f' },
  { light: '#01579b', dark: '#01579b' },
  { light: '#8e24aa', dark: '#8e24aa' },
  { light: '#90a4ae', dark: '#607d8b', label: 'Neutral' },
  { light: '#ff4081', dark: '#ff4081' },
  { light: '#ff6e40', dark: '#ff6e40' },
  { light: '#aeea00', dark: '#aeea00' },
  { light: '#304ffe', dark: '#304ffe' },
  { light: '#7c4dff', dark: '#7c4dff' },
  { light: '#cfd8dc', dark: '#455a64' },
  { light: '#f8bbd0', dark: '#ec407a' },
  { light: '#ffccbc', dark: '#ff7043' },
  { light: '#f0f4c3', dark: '#c0ca33' },
  { light: '#9fa8da', dark: '#5c6bc0' },
  { light: '#d1c4e9', dark: '#9575cd' },
] as const;
