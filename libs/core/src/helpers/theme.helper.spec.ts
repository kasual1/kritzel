import { ThemeHelper } from './theme.helper';
import { UpdrawTheme } from '../interfaces/theme.interface';
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
      const hasNameVariable = Array.from(variables.keys()).some((key) => key.includes('--updraw-name'));
      expect(hasNameVariable).toBe(false);
    });

    it('should create variables with --updraw prefix', () => {
      const variables = ThemeHelper.flattenThemeToVariables(lightTheme);
      for (const key of variables.keys()) {
        expect(key.startsWith('--updraw-')).toBe(true);
      }
    });

    it('should correctly flatten global variables', () => {
      const variables = ThemeHelper.flattenThemeToVariables(lightTheme);
      expect(variables.get('--updraw-global-focus-ring-color')).toBe('#333333');
      expect(variables.get('--updraw-global-focus-color')).toBe('#333333');
      expect(variables.get('--updraw-global-icon-color')).toBe('currentColor');
      expect(variables.get('--updraw-global-divider-color')).toBe('#e0e0e0');
      expect(variables.get('--updraw-selection-border-color')).toBe('#007AFF');
    });

    it('should correctly flatten engine variables', () => {
      const variables = ThemeHelper.flattenThemeToVariables(lightTheme);
      expect(variables.get('--updraw-engine-background-color')).toBe('#ffffff');
    });

    it('should flatten snap indicator styling variables for custom themes', () => {
      const variables = ThemeHelper.flattenThemeToVariables(lightTheme);
      expect(variables.get('--updraw-snap-indicator-fill')).toBe('rgba(59, 130, 246, 0.3)');
      expect(variables.get('--updraw-snap-indicator-fill-inactive')).toBe('rgba(59, 130, 246, 0.18)');
      expect(variables.get('--updraw-snap-indicator-stroke')).toBe('#007bff');
      expect(variables.get('--updraw-snap-indicator-stroke-inactive')).toBe('rgba(59, 130, 246, 0.5)');
    });

    it('should correctly flatten toolbar variables', () => {
      const variables = ThemeHelper.flattenThemeToVariables(lightTheme);
      expect(variables.get('--updraw-toolbar-background-color')).toBe('#ffffff');
      expect(variables.get('--updraw-toolbar-border')).toBe('1px solid #ebebeb');
      expect(variables.get('--updraw-toolbar-control-hover-background-color')).toBe('hsl(0, 0%, 0%, 4.3%)');
      expect(variables.get('--updraw-toolbar-control-selected-background-color')).toBe('#007AFF');
    });

    it('should correctly flatten tooltip variables', () => {
      const variables = ThemeHelper.flattenThemeToVariables(lightTheme);
      expect(variables.get('--updraw-tooltip-background-color')).toBe('#ffffff');
      expect(variables.get('--updraw-tooltip-color')).toBe('#000000');
    });

    it('should correctly flatten menu variables', () => {
      const variables = ThemeHelper.flattenThemeToVariables(lightTheme);
      expect(variables.get('--updraw-menu-item-selected-background-color')).toBe('#007aff');
      expect(variables.get('--updraw-menu-item-color')).toBe('#333333');
      expect(variables.get('--updraw-menu-background-color')).toBe('#ffffff');
    });

    it('should correctly flatten dropdown variables', () => {
      const variables = ThemeHelper.flattenThemeToVariables(lightTheme);
      expect(variables.get('--updraw-dropdown-text-color')).toBe('#333333');
      expect(variables.get('--updraw-dropdown-hover-background-color')).toBe('#f0f0f0');
      expect(variables.get('--updraw-dropdown-selected-background-color')).toBe('#007bff1a');
    });

    it('should use custom prefix when provided', () => {
      const variables = ThemeHelper.flattenThemeToVariables(lightTheme, '--custom');
      expect(variables.get('--custom-global-focus-color')).toBe('#333333');
      expect(variables.get('--custom-toolbar-background-color')).toBe('#ffffff');
    });

    it('should return the expected number of variables', () => {
      const variables = ThemeHelper.flattenThemeToVariables(lightTheme);
      expect(variables.size).toBe(342);
      expect(variables.get('--updraw-object-box-shadow')).toBe(lightTheme.object!.boxShadow);
      expect(variables.get('--updraw-image-drop-shadow')).toBe(lightTheme.image!.dropShadow);
      expect(variables.get('--updraw-object-appear-animation-duration')).toBe(lightTheme.objectAppear!.animationDuration);
      expect(variables.get('--updraw-chat-box-chip-muted-text-color')).toBe('#71717a');
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
        ['--updraw-global-focus-color', '#007acc'],
        ['--updraw-toolbar-gap', '8px'],
      ]);

      ThemeHelper.applyVariablesToElement(mockElement, variables);

      expect(setPropertyMock).toHaveBeenCalledTimes(2);
      expect(setPropertyMock).toHaveBeenCalledWith('--updraw-global-focus-color', '#007acc');
      expect(setPropertyMock).toHaveBeenCalledWith('--updraw-toolbar-gap', '8px');
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
    let removePropertyMock: jest.Mock;

    beforeEach(() => {
      setPropertyMock = jest.fn();
      removePropertyMock = jest.fn();
      mockElement = {
        style: {
          setProperty: setPropertyMock,
          removeProperty: removePropertyMock,
        },
      } as unknown as HTMLElement;
    });

    it('should apply all theme variables to the element', () => {
      ThemeHelper.applyThemeToElement(mockElement, lightTheme);

      expect(setPropertyMock).toHaveBeenCalledTimes(342);
    });

    it('should apply specific theme values correctly', () => {
      ThemeHelper.applyThemeToElement(mockElement, lightTheme);

      expect(setPropertyMock).toHaveBeenCalledWith('--updraw-global-focus-color', '#333333');
      expect(setPropertyMock).toHaveBeenCalledWith('--updraw-toolbar-background-color', '#ffffff');
      expect(setPropertyMock).toHaveBeenCalledWith('--updraw-tooltip-background-color', '#ffffff');
    });

    it('should work with custom theme objects', () => {
      const customTheme: UpdrawTheme = {
        ...lightTheme,
        global: {
          ...lightTheme.global,
          focusColor: '#ff0000',
        },
      };

      ThemeHelper.applyThemeToElement(mockElement, customTheme);

      expect(setPropertyMock).toHaveBeenCalledWith('--updraw-global-focus-color', '#ff0000');
    });

    it('should remove variables that are absent from the next theme', () => {
      const completeTheme = {
        name: 'complete',
        global: {
          focusColor: '#ffffff',
          dividerColor: '#333333',
        },
      } as UpdrawTheme;
      const partialTheme = {
        name: 'partial',
        global: {
          focusColor: '#000000',
        },
      } as UpdrawTheme;

      ThemeHelper.applyThemeToElement(mockElement, completeTheme);
      ThemeHelper.applyThemeToElement(mockElement, partialTheme);

      expect(removePropertyMock).toHaveBeenCalledWith('--updraw-global-divider-color');
      expect(removePropertyMock).not.toHaveBeenCalledWith('--updraw-global-focus-color');
      expect(setPropertyMock).toHaveBeenLastCalledWith('--updraw-global-focus-color', '#000000');
    });
  });
});
