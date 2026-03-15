import { KritzelTheme, ThemeName } from '../../interfaces/theme.interface';
import { lightTheme } from '../../themes/light-theme';
import { darkTheme } from '../../themes/dark-theme';
import { KritzelCore } from '../core/core.class';
import { ThemeHelper } from '../../helpers/theme.helper';

/** Key used to store the theme preference in localStorage. */
const THEME_STORAGE_KEY = 'kritzel-theme';

/** Default theme used when no stored preference exists. */
const DEFAULT_THEME: ThemeName = 'light';

/**
 * Manages theme state and application across the Kritzel editor.
 * Handles theme persistence, retrieval, and CSS variable application.
 *
 * The theme manager is responsible for:
 * - Storing and retrieving user theme preferences from localStorage
 * - Applying CSS custom properties to target elements
 * - Switching between light and dark themes
 */
export class KritzelThemeManager {
  private readonly _core: KritzelCore;
  private _currentTheme: ThemeName = DEFAULT_THEME;
  private _targetElement: HTMLElement | null = null;
  private readonly _storageKey: string;

  /**
   * Creates a new KritzelThemeManager instance.
   * Initializes the current theme from localStorage or uses the default theme.
   *
   * @param core - The KritzelCore instance this manager belongs to
   */
  constructor(core: KritzelCore) {
    this._core = core;
    this._storageKey = core.editorId ? `${THEME_STORAGE_KEY}-${core.editorId}` : THEME_STORAGE_KEY;
    this._currentTheme = this.getStoredTheme();
    void this._core;
  }

  /**
   * Gets the current active theme name.
   *
   * @returns The name of the currently active theme ('light' or 'dark')
   */
  get currentTheme(): ThemeName {
    return this._currentTheme;
  }

  /**
   * Sets the target element where theme CSS variables will be applied.
   * If an element is provided, the current theme is immediately applied to it.
   *
   * @param element - The HTML element to apply theme styles to, or null to clear
   */
  setTargetElement(element: HTMLElement | null): void {
    this._targetElement = element;

    if (this._targetElement) {
      this.applyTheme(this._currentTheme);
    }
  }

  /**
   * Gets the current target element where theme CSS variables are applied.
   *
   * @returns The current target HTML element, or null if none is set
   */
  getTargetElement(): HTMLElement | null {
    return this._targetElement;
  }

  /**
   * Gets the theme configuration object by its name.
   * Returns the corresponding theme object containing all CSS variable values.
   *
   * @param themeName - The name of the theme to retrieve ('light' or 'dark')
   * @returns The KritzelTheme object containing all theme CSS variable values
   */
  getThemeByName(themeName: ThemeName): KritzelTheme {
    return themeName === 'dark' ? darkTheme : lightTheme;
  }

  /**
   * Gets the stored theme name from localStorage using this instance's namespaced key.
   *
   * @returns The stored theme name if valid, or 'light' as the default
   */
  getStoredTheme(): ThemeName {
    if (typeof localStorage === 'undefined') {
      return DEFAULT_THEME;
    }
    const stored = localStorage.getItem(this._storageKey);
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    return DEFAULT_THEME;
  }

  /**
   * Gets the stored theme from the default (non-namespaced) localStorage key.
   * Used by static utility helpers that don't have access to a core instance.
   *
   * @returns The stored theme name if valid, or 'light' as the default
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
   * Saves the theme name to localStorage for persistence across sessions.
   * Does nothing if localStorage is not available (e.g., in SSR environments).
   *
   * @param themeName - The theme name to save ('light' or 'dark')
   */
  saveTheme(themeName: ThemeName): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(this._storageKey, themeName);
  }

  /**
   * Sets the current theme, persists it to storage, and applies it to the target element.
   * This is the primary method for changing themes at runtime.
   *
   * @param themeName - The theme name to set ('light' or 'dark')
   */
  setTheme(themeName: ThemeName): void {
    this._currentTheme = themeName;
    this.saveTheme(themeName);

    if (this._targetElement) {
      this.applyTheme(themeName);
    }
  }

  /**
   * Checks if the current theme is the dark theme.
   *
   * @returns True if the current theme is 'dark', false otherwise
   */
  isDarkTheme(): boolean {
    return this._currentTheme === 'dark';
  }

  /**
   * Applies a theme to the target element by setting CSS custom properties.
   * Uses the ThemeHelper utility to automatically derive CSS variable names
   * from the theme interface structure and apply them to the element's style.
   * Does nothing if no target element is set.
   *
   * @param themeName - The name of the theme to apply ('light' or 'dark')
   */
  applyTheme(themeName: ThemeName): void {
    if (!this._targetElement) {
      return;
    }

    const theme = this.getThemeByName(themeName);
    ThemeHelper.applyThemeToElement(this._targetElement, theme);
  }

  /**
   * Cleans up the theme manager state by clearing the target element reference.
   * Should be called when the manager is no longer needed to prevent memory leaks.
   */
  cleanup(): void {
    this._targetElement = null;
  }
}
