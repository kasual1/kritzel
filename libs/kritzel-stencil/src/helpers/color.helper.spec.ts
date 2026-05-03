import { KritzelColorHelper } from './color.helper';
import { ThemeAwareColor } from '../constants/color-palette.constants';

jest.mock('../classes/managers/theme.manager', () => ({
  KritzelThemeManager: {
    getStoredTheme: jest.fn().mockReturnValue('light'),
  },
}));

import { KritzelThemeManager } from '../classes/managers/theme.manager';

const mockedGetStoredTheme = KritzelThemeManager.getStoredTheme as jest.Mock;

describe('KritzelColorHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetStoredTheme.mockReturnValue('light');
  });

  describe('resolveThemeColor', () => {
    it('should resolve color for light theme', () => {
      const color: ThemeAwareColor = { light: '#000000', dark: '#ffffff' };

      const result = KritzelColorHelper.resolveThemeColor(color);

      expect(result).toBe('#000000');
    });

    it('should resolve color for dark theme from ThemeManager', () => {
      mockedGetStoredTheme.mockReturnValue('dark');
      const color: ThemeAwareColor = { light: '#000000', dark: '#ffffff' };

      const result = KritzelColorHelper.resolveThemeColor(color);

      expect(result).toBe('#ffffff');
    });

    it('should use explicit theme parameter over stored theme', () => {
      mockedGetStoredTheme.mockReturnValue('light');
      const color: ThemeAwareColor = { light: '#000000', dark: '#ffffff' };

      const result = KritzelColorHelper.resolveThemeColor(color, 'dark');

      expect(result).toBe('#ffffff');
      expect(mockedGetStoredTheme).not.toHaveBeenCalled();
    });

    it('should return empty string for undefined color', () => {
      const result = KritzelColorHelper.resolveThemeColor(undefined);

      expect(result).toBe('');
    });
  });

  describe('applyOpacity', () => {
    const color: ThemeAwareColor = { light: '#ff5252', dark: '#ff5252' };

    it('should return hex color when opacity is 1', () => {
      const result = KritzelColorHelper.applyOpacity(color, 1);

      expect(result).toBe('#ff5252');
    });

    it('should return hex color when opacity is greater than 1', () => {
      const result = KritzelColorHelper.applyOpacity(color, 1.5);

      expect(result).toBe('#ff5252');
    });

    it('should return rgba string for fractional opacity', () => {
      const result = KritzelColorHelper.applyOpacity(color, 0.5);

      expect(result).toBe('rgba(255, 82, 82, 0.5)');
    });

    it('should return rgba with opacity 0', () => {
      const result = KritzelColorHelper.applyOpacity(color, 0);

      expect(result).toBe('rgba(255, 82, 82, 0)');
    });

    it('should handle 3-character hex colors', () => {
      const shortColor: ThemeAwareColor = { light: '#f00', dark: '#f00' };

      const result = KritzelColorHelper.applyOpacity(shortColor, 0.5);

      expect(result).toBe('rgba(255, 0, 0, 0.5)');
    });

    it('should handle hex without # prefix', () => {
      const noHashColor: ThemeAwareColor = { light: '00c853', dark: '00c853' };

      const result = KritzelColorHelper.applyOpacity(noHashColor, 0.8);

      expect(result).toBe('rgba(0, 200, 83, 0.8)');
    });

    it('should return hex for invalid hex length', () => {
      const badColor: ThemeAwareColor = { light: '#abcd', dark: '#abcd' };

      const result = KritzelColorHelper.applyOpacity(badColor, 0.5);

      expect(result).toBe('#abcd');
    });

    it('should return hex for NaN parse results', () => {
      const nanColor: ThemeAwareColor = { light: '#zzzzzz', dark: '#zzzzzz' };

      const result = KritzelColorHelper.applyOpacity(nanColor, 0.5);

      expect(result).toBe('#zzzzzz');
    });

    it('should use explicit theme parameter', () => {
      const themeColor: ThemeAwareColor = { light: '#000000', dark: '#ffffff' };

      const result = KritzelColorHelper.applyOpacity(themeColor, 0.5, 'dark');

      expect(result).toBe('rgba(255, 255, 255, 0.5)');
    });

    it('should return empty string when resolveThemeColor returns empty', () => {
      const result = KritzelColorHelper.applyOpacity(undefined as any, 0.5);

      expect(result).toBe('');
    });

    it('should accept an already-resolved hex string', () => {
      const result = KritzelColorHelper.applyOpacity('#ff5252', 0.5);

      expect(result).toBe('rgba(255, 82, 82, 0.5)');
    });

    it('should pass through string input unchanged when opacity >= 1', () => {
      const result = KritzelColorHelper.applyOpacity('#ff5252', 1);

      expect(result).toBe('#ff5252');
    });

    it('should pass through transparent string input unchanged', () => {
      const result = KritzelColorHelper.applyOpacity('transparent', 0.5);

      expect(result).toBe('transparent');
    });

    it('should ignore the theme parameter when input is a string', () => {
      const result = KritzelColorHelper.applyOpacity('#ff5252', 0.5, 'dark');

      expect(result).toBe('rgba(255, 82, 82, 0.5)');
      expect(mockedGetStoredTheme).not.toHaveBeenCalled();
    });
  });

  describe('getContrastColor', () => {
    it('should return black for white background', () => {
      expect(KritzelColorHelper.getContrastColor('#ffffff')).toBe('#000000');
    });

    it('should return white for black background', () => {
      expect(KritzelColorHelper.getContrastColor('#000000')).toBe('#ffffff');
    });

    it('should return black for light color', () => {
      expect(KritzelColorHelper.getContrastColor('#ffbc00')).toBe('#000000');
    });

    it('should return white for dark color', () => {
      expect(KritzelColorHelper.getContrastColor('#01579b')).toBe('#ffffff');
    });

    it('should handle 3-character hex', () => {
      expect(KritzelColorHelper.getContrastColor('#fff')).toBe('#000000');
      expect(KritzelColorHelper.getContrastColor('#000')).toBe('#ffffff');
    });

    it('should handle hex without # prefix', () => {
      expect(KritzelColorHelper.getContrastColor('ffffff')).toBe('#000000');
      expect(KritzelColorHelper.getContrastColor('000000')).toBe('#ffffff');
    });

    it('should return black for invalid hex length', () => {
      expect(KritzelColorHelper.getContrastColor('#ab')).toBe('#000000');
      expect(KritzelColorHelper.getContrastColor('#abcde')).toBe('#000000');
    });

    it('should return black for NaN parse results', () => {
      expect(KritzelColorHelper.getContrastColor('#zzzzzz')).toBe('#000000');
    });

    it('should handle mid-luminance colors correctly', () => {
      // RGB (150, 150, 150) -> luminance = 0.299*150 + 0.587*150 + 0.114*150 = 150
      // luminance > 150 is false, so returns white
      expect(KritzelColorHelper.getContrastColor('#969696')).toBe('#ffffff');

      // RGB (151, 151, 151) -> luminance = 151 > 150, returns black
      expect(KritzelColorHelper.getContrastColor('#979797')).toBe('#000000');
    });
  });

  describe('determineTextColor', () => {
    it('should return default colors for fully transparent fill', () => {
      const fill: ThemeAwareColor = { light: 'transparent', dark: 'transparent' };

      const result = KritzelColorHelper.determineTextColor(fill);

      expect(result).toEqual({ light: '#000000', dark: '#ffffff' });
    });

    it('should determine contrast colors for opaque fill', () => {
      const fill: ThemeAwareColor = { light: '#ffffff', dark: '#000000' };

      const result = KritzelColorHelper.determineTextColor(fill);

      expect(result).toEqual({ light: '#000000', dark: '#ffffff' });
    });

    it('should use default for transparent light, contrast for dark', () => {
      const fill: ThemeAwareColor = { light: 'transparent', dark: '#000000' };

      const result = KritzelColorHelper.determineTextColor(fill);

      expect(result).toEqual({ light: '#000000', dark: '#ffffff' });
    });

    it('should use contrast for light, default for transparent dark', () => {
      const fill: ThemeAwareColor = { light: '#ffffff', dark: 'transparent' };

      const result = KritzelColorHelper.determineTextColor(fill);

      expect(result).toEqual({ light: '#000000', dark: '#ffffff' });
    });

    it('should return white text for dark fills in both themes', () => {
      const darkFill: ThemeAwareColor = { light: '#000000', dark: '#01579b' };

      const result = KritzelColorHelper.determineTextColor(darkFill);

      expect(result).toEqual({ light: '#ffffff', dark: '#ffffff' });
    });

    it('should return black text for light fills in both themes', () => {
      const lightFill: ThemeAwareColor = { light: '#ffffff', dark: '#ffbc00' };

      const result = KritzelColorHelper.determineTextColor(lightFill);

      expect(result).toEqual({ light: '#000000', dark: '#000000' });
    });
  });
});
