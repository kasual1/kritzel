import { ThemeHelper } from './theme.helper';
import { KritzelTheme } from '../interfaces/theme.interface';
import { lightTheme } from '../themes/light-theme';

describe('ThemeHelper', () => {
  describe('camelToKebab', () => {
    it('should return single lowercase words unchanged', () => {
      expect(ThemeHelper.camelToKebab('gap')).toBe('gap');
    });

    it('should convert simple camelCase to kebab-case', () => {
      expect(ThemeHelper.camelToKebab('backgroundColor')).toBe('background-color');
    });

    it('should convert multiple camelCase words', () => {
      expect(ThemeHelper.camelToKebab('controlHoverBackgroundColor')).toBe('control-hover-background-color');
    });

    it('should handle consecutive capitals correctly', () => {
      expect(ThemeHelper.camelToKebab('htmlElement')).toBe('html-element');
    });

    it('should handle numbers in the string', () => {
      expect(ThemeHelper.camelToKebab('padding8px')).toBe('padding8px');
      expect(ThemeHelper.camelToKebab('item2Color')).toBe('item2-color');
    });

    it('should handle strings starting with lowercase', () => {
      expect(ThemeHelper.camelToKebab('borderRadius')).toBe('border-radius');
    });

    it('should handle already kebab-case strings', () => {
      expect(ThemeHelper.camelToKebab('border-radius')).toBe('border-radius');
    });

    it('should handle empty string', () => {
      expect(ThemeHelper.camelToKebab('')).toBe('');
    });
  });

  describe('flattenThemeToVariables', () => {
    it('should skip the name property at root level', () => {
      const variables = ThemeHelper.flattenThemeToVariables(lightTheme);
      const hasNameVariable = Array.from(variables.keys()).some((key) => key.includes('--kritzel-name'));
      expect(hasNameVariable).toBe(false);
    });

    it('should create variables with --kritzel prefix', () => {
      const variables = ThemeHelper.flattenThemeToVariables(lightTheme);
      for (const key of variables.keys()) {
        expect(key.startsWith('--kritzel-')).toBe(true);
      }
    });

    it('should correctly flatten global variables', () => {
      const variables = ThemeHelper.flattenThemeToVariables(lightTheme);
      expect(variables.get('--kritzel-global-pointer-cursor')).toBe('pointer');
      expect(variables.get('--kritzel-global-focus-ring-color')).toBe('rgba(0, 122, 255, 0.3)');
      expect(variables.get('--kritzel-global-focus-color')).toBe('#007acc');
      expect(variables.get('--kritzel-global-icon-color')).toBe('currentColor');
      expect(variables.get('--kritzel-global-divider-color')).toBe('#e0e0e0');
      expect(variables.get('--kritzel-global-selection-border-color')).toBe('#007AFF');
    });

    it('should correctly flatten engine variables', () => {
      const variables = ThemeHelper.flattenThemeToVariables(lightTheme);
      expect(variables.get('--kritzel-engine-background-color')).toBe('#ffffff');
    });

    it('should correctly flatten controls variables', () => {
      const variables = ThemeHelper.flattenThemeToVariables(lightTheme);
      expect(variables.get('--kritzel-controls-gap')).toBe('8px');
      expect(variables.get('--kritzel-controls-padding')).toBe('8px');
      expect(variables.get('--kritzel-controls-background-color')).toBe('#ffffff');
      expect(variables.get('--kritzel-controls-control-hover-background-color')).toBe('hsl(0, 0%, 0%, 4.3%)');
    });

    it('should correctly flatten tooltip variables', () => {
      const variables = ThemeHelper.flattenThemeToVariables(lightTheme);
      expect(variables.get('--kritzel-tooltip-background-color')).toBe('#ffffff');
      expect(variables.get('--kritzel-tooltip-color')).toBe('#000000');
      expect(variables.get('--kritzel-tooltip-padding')).toBe('12px');
    });

    it('should correctly flatten menu variables', () => {
      const variables = ThemeHelper.flattenThemeToVariables(lightTheme);
      expect(variables.get('--kritzel-menu-item-selected-background-color')).toBe('#007aff');
      expect(variables.get('--kritzel-menu-item-hover-background-color')).toBe('hsl(0, 0%, 0%, 4.3%)');
    });

    it('should correctly flatten dropdown variables', () => {
      const variables = ThemeHelper.flattenThemeToVariables(lightTheme);
      expect(variables.get('--kritzel-dropdown-color')).toBe('#333333');
      expect(variables.get('--kritzel-dropdown-hover-background-color')).toBe('#f0f0f0');
      expect(variables.get('--kritzel-dropdown-selected-background-color')).toBe('#007bff1a');
    });

    it('should use custom prefix when provided', () => {
      const variables = ThemeHelper.flattenThemeToVariables(lightTheme, '--custom');
      expect(variables.get('--custom-global-pointer-cursor')).toBe('pointer');
      expect(variables.get('--custom-controls-gap')).toBe('8px');
    });

    it('should return the expected number of variables', () => {
      const variables = ThemeHelper.flattenThemeToVariables(lightTheme);
      // Count all string properties in theme (excluding 'name')
      // global: 6, engine: 1, controls: 14, tooltip: 5, contextMenu: 13,
      // menu: 17, slideToggle: 8, splitButton: 9, dropdown: 4, opacitySlider: 4,
      // strokeSize: 2, lineEndings: 4, utilityPanel: 1, colorPalette: 2, submenu: 1, portal: 1
      // Total: 92
      expect(variables.size).toBe(92);
    });
  });

  describe('applyVariablesToElement', () => {
    let mockElement: HTMLElement;
    let setPropertyMock: jest.Mock;

    beforeEach(() => {
      setPropertyMock = jest.fn();
      mockElement = {
        style: {
          setProperty: setPropertyMock,
        },
      } as unknown as HTMLElement;
    });

    it('should call setProperty for each variable', () => {
      const variables = new Map<string, string>([
        ['--kritzel-global-focus-color', '#007acc'],
        ['--kritzel-controls-gap', '8px'],
      ]);

      ThemeHelper.applyVariablesToElement(mockElement, variables);

      expect(setPropertyMock).toHaveBeenCalledTimes(2);
      expect(setPropertyMock).toHaveBeenCalledWith('--kritzel-global-focus-color', '#007acc');
      expect(setPropertyMock).toHaveBeenCalledWith('--kritzel-controls-gap', '8px');
    });

    it('should handle empty variables map', () => {
      const variables = new Map<string, string>();

      ThemeHelper.applyVariablesToElement(mockElement, variables);

      expect(setPropertyMock).not.toHaveBeenCalled();
    });
  });

  describe('applyThemeToElement', () => {
    let mockElement: HTMLElement;
    let setPropertyMock: jest.Mock;

    beforeEach(() => {
      setPropertyMock = jest.fn();
      mockElement = {
        style: {
          setProperty: setPropertyMock,
        },
      } as unknown as HTMLElement;
    });

    it('should apply all theme variables to the element', () => {
      ThemeHelper.applyThemeToElement(mockElement, lightTheme);

      // Should have called setProperty for all 92 variables
      expect(setPropertyMock).toHaveBeenCalledTimes(92);
    });

    it('should apply specific theme values correctly', () => {
      ThemeHelper.applyThemeToElement(mockElement, lightTheme);

      expect(setPropertyMock).toHaveBeenCalledWith('--kritzel-global-pointer-cursor', 'pointer');
      expect(setPropertyMock).toHaveBeenCalledWith('--kritzel-controls-gap', '8px');
      expect(setPropertyMock).toHaveBeenCalledWith('--kritzel-tooltip-background-color', '#ffffff');
    });

    it('should work with custom theme objects', () => {
      const customTheme: KritzelTheme = {
        ...lightTheme,
        global: {
          ...lightTheme.global,
          focusColor: '#ff0000',
        },
      };

      ThemeHelper.applyThemeToElement(mockElement, customTheme);

      expect(setPropertyMock).toHaveBeenCalledWith('--kritzel-global-focus-color', '#ff0000');
    });
  });
});
