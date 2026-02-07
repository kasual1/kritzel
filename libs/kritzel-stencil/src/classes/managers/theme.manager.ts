import { KritzelTheme, ThemeName } from '../../interfaces/theme.interface';
import { lightTheme } from '../../themes/light-theme';
import { darkTheme } from '../../themes/dark-theme';
import { KritzelCore } from '../core/core.class';
import { ThemeHelper } from '../../helpers/theme.helper';

const THEME_STORAGE_KEY = 'kritzel-theme';
const DEFAULT_THEME: ThemeName = 'light';

/**
 * Manages theme state and application across the Kritzel editor.
 * Handles theme persistence, retrieval, and CSS variable application.
 */
export class KritzelThemeManager {
  private readonly _core: KritzelCore;
  private _currentTheme: ThemeName = DEFAULT_THEME;
  private _targetElement: HTMLElement | null = null;

  constructor(core: KritzelCore) {
    this._core = core;
    this._currentTheme = KritzelThemeManager.getStoredTheme();
    void this._core;
  }

  /**
   * Gets the current active theme name.
   */
  get currentTheme(): ThemeName {
    return this._currentTheme;
  }

  /**
   * Sets the target element where theme CSS variables will be applied.
   */
  setTargetElement(element: HTMLElement | null): void {
    this._targetElement = element;

    if (this._targetElement) {
      this.applyTheme(this._currentTheme);
    }
  }

  /**
   * Gets the current target element.
   */
  getTargetElement(): HTMLElement | null {
    return this._targetElement;
  }

  /**
   * Gets the theme object by name.
   */
  getThemeByName(themeName: ThemeName): KritzelTheme {
    return themeName === 'dark' ? darkTheme : lightTheme;
  }

  /**
   * Gets the stored theme name from localStorage.
   * Can be called statically without a manager instance.
   * @returns The stored theme name, or 'light' as default
   */
  static getStoredTheme(): ThemeName {
    if (typeof localStorage === 'undefined') {
      return DEFAULT_THEME;
    }
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    return DEFAULT_THEME;
  }

  /**
   * Saves the theme name to localStorage.
   */
  saveTheme(themeName: ThemeName): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(THEME_STORAGE_KEY, themeName);
  }

  /**
   * Sets the current theme, saves it to storage, and applies it to the target element.
   */
  setTheme(themeName: ThemeName): void {
    this._currentTheme = themeName;
    this.saveTheme(themeName);

    if (this._targetElement) {
      this.applyTheme(themeName);
    }
  }

  /**
   * Checks if the current theme is dark.
   */
  isDarkTheme(): boolean {
    return this._currentTheme === 'dark';
  }

  /**
   * Applies a theme to the target element by setting CSS custom properties.
   * Uses the generic theme utility to automatically derive CSS variable names
   * from the theme interface structure.
   */
  applyTheme(themeName: ThemeName): void {
    if (!this._targetElement) {
      return;
    }

    const theme = this.getThemeByName(themeName);
    ThemeHelper.applyThemeToElement(this._targetElement, theme);
  }

  /**
   * Cleans up theme manager state.
   */
  cleanup(): void {
    this._targetElement = null;
  }
}
