import { KritzelTheme } from '../interfaces/theme.interface';

export class ThemeHelper {
  private static readonly appliedVariableNames = new WeakMap<HTMLElement, Set<string>>();

  /**
   * Converts a camelCase string to kebab-case.
   * @example ThemeHelper.camelToKebab('controlHoverBackgroundColor') → 'control-hover-background-color'
   * @example ThemeHelper.camelToKebab('backgroundColor') → 'background-color'
   * @example ThemeHelper.camelToKebab('gap') → 'gap'
   */
  static camelToKebab(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * Recursively flattens a theme object into a map of CSS variable names to values.
   * Skips the 'name' property at the root level since it's the theme identifier, not a CSS value.
   *
   * @param theme - The theme object to flatten
   * @param prefix - The CSS variable prefix (default: '--kritzel')
   * @returns A Map of CSS variable names to their values
   *
   * @example
   * ThemeHelper.flattenThemeToVariables(lightTheme)
   * // Returns Map {
   * //   '--kritzel-global-pointer-cursor' => 'pointer',
   * //   '--kritzel-controls-gap' => '8px',
   * //   ...
   * // }
   */
  static flattenThemeToVariables(
    theme: KritzelTheme,
    prefix = '--kritzel',
  ): Map<string, string> {
    const variables = new Map<string, string>();

    const recurse = (obj: Record<string, unknown>, currentPrefix: string, isRoot = false): void => {
      for (const [key, value] of Object.entries(obj)) {
        // Skip the 'name' property at the root level
        if (isRoot && key === 'name') {
          continue;
        }

        const kebabKey = ThemeHelper.camelToKebab(key);
        const variableName = `${currentPrefix}-${kebabKey}`;

        if (typeof value === 'object' && value !== null) {
          recurse(value as Record<string, unknown>, variableName);
        } else if (typeof value === 'string') {
          variables.set(variableName, value);
        }
      }
    };

    recurse(theme as unknown as Record<string, unknown>, prefix, true);

    return variables;
  }

  /**
   * Applies a map of CSS variables to an HTML element.
   *
   * @param element - The target HTML element
   * @param variables - A Map of CSS variable names to values
   */
  static applyVariablesToElement(
    element: HTMLElement,
    variables: Map<string, string>,
  ): void {
    for (const [name, value] of variables) {
      element.style.setProperty(name, value);
    }
  }

  /**
   * Convenience method that flattens a theme and applies it to an element in one call.
   *
   * @param element - The target HTML element
   * @param theme - The theme object to apply
   */
  static applyThemeToElement(element: HTMLElement, theme: KritzelTheme): void {
    const variables = ThemeHelper.flattenThemeToVariables(theme);
    const previousVariableNames = ThemeHelper.appliedVariableNames.get(element);

    for (const name of previousVariableNames ?? []) {
      if (!variables.has(name)) {
        element.style.removeProperty(name);
      }
    }

    ThemeHelper.applyVariablesToElement(element, variables);
    ThemeHelper.appliedVariableNames.set(element, new Set(variables.keys()));
  }
}
