import { KritzelTermVars } from '../interfaces/localization.interface';

/**
 * Pure static utilities for localization term resolution.
 */
export class LocalizationHelper {
  /**
   * Interpolates `{placeholder}` tokens in a term template with the provided
   * variables. Tokens without a matching variable are left untouched.
   *
   * @param template - The raw term string, e.g. `'Expires {date}'`
   * @param vars - Map of placeholder names to replacement values
   * @returns The interpolated string
   *
   * @example
   * LocalizationHelper.interpolate('Hello {name}', { name: 'Ada' }); // 'Hello Ada'
   */
  static interpolate(template: string, vars?: KritzelTermVars): string {
    if (!vars) {
      return template;
    }
    return template.replace(/\{(\w+)\}/g, (match, key: string) => {
      const value = vars[key];
      return value === undefined || value === null ? match : String(value);
    });
  }
}
