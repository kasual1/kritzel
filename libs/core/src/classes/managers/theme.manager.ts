import { KritzelTheme, ThemeName } from '../../interfaces/theme.interface';
import { lightTheme } from '../../themes/light-theme';
import { darkTheme } from '../../themes/dark-theme';
import { KritzelCore } from '../core/core.class';
import { ThemeHelper } from '../../helpers/theme.helper';

/** Key used to store the settings object in localStorage. */
const SETTINGS_STORAGE_KEY = 'kritzel-settings';

/** Default theme used when no stored preference exists. */
const DEFAULT_THEME: ThemeName = 'light';

/**
 * Manages theme state and application across the Kritzel editor.
 * Reads the persisted theme from the settings object in localStorage but does not write to it.
 * Persistence is handled exclusively by the KritzelSettings component.
 *
 * The theme manager is responsible for:
 * - Reading the stored theme preference from the settings object
 * - Applying CSS custom properties to target elements
 * - Switching between light and dark themes at runtime
 */
export class KritzelThemeManager {
  private readonly _core: KritzelCore;
  private _currentTheme: ThemeName = DEFAULT_THEME;
  private _targetElement: HTMLElement | null = null;
  private readonly _storageKey: string;
  private _themeRegistry = new Map<string, KritzelTheme>();

  /**
   * Creates a new KritzelThemeManager instance.
   * Initializes the current theme from the settings object in localStorage or uses the default theme.
   *
   * @param core - The KritzelCore instance this manager belongs to
   */
  constructor(core: KritzelCore) {
    this._core = core;
    this._storageKey = core.editorId ? `${SETTINGS_STORAGE_KEY}-${core.editorId}` : SETTINGS_STORAGE_KEY;
    
    this._themeRegistry.set('light', lightTheme);
    this._themeRegistry.set('dark', darkTheme);

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
   * Falls back to the first registered theme if the requested name is not found.
   *
   * @param themeName - The name of the theme to retrieve
   * @returns The KritzelTheme object containing all theme CSS variable values
   */
  getThemeByName(themeName: ThemeName): KritzelTheme {
    return this._themeRegistry.get(themeName) ?? this._themeRegistry.values().next().value!;
  }

  /**
   * Registers the provided themes to this theme manager instance.
   *
   * @param themes - The complete list of themes to make available
   */
  registerThemes(themes: KritzelTheme[]): void {
    if (themes.length === 0) {
      console.warn('[KritzelThemeManager] registerThemes called with an empty array. The theme registry will be empty.');
    }
    this._themeRegistry.clear();
    for (const theme of themes) {
      this._themeRegistry.set(theme.name, theme);
    }
  }

  /**
   * Pre-emptively applies the stored theme's CSS variables to the closest editor or document.
   * This prevents a "Flash of Unstyled Content" (FOUC) while Stencil web components are hydrating.
   * 
   * @param element - The HTML element to apply the theme to
   */
  injectThemeEarly(element?: HTMLElement): void {
    let targetElement = element;
    if (!targetElement && typeof document !== 'undefined') {
      targetElement = document.documentElement;
    }
    if (!targetElement) return;

    const themeName = this.getStoredTheme();
    const theme = this.getThemeByName(themeName);
    ThemeHelper.applyThemeToElement(targetElement, theme);
  }

  /**
   * Gets all registered themes.
   *
   * @returns An array of all registered theme objects
   */
  getAllThemes(): KritzelTheme[] {
    return Array.from(this._themeRegistry.values());
  }

  /**
   * Gets the stored theme name from the settings object in localStorage using this instance's namespaced key.
   *
   * @returns The stored theme name if valid, or 'light' as the default
   */
  getStoredTheme(): ThemeName {
    if (typeof localStorage === 'undefined') {
      return DEFAULT_THEME;
    }
    const stored = localStorage.getItem(this._storageKey);
    if (!stored) {
      return DEFAULT_THEME;
    }
    try {
      const parsed = JSON.parse(stored);
      if (typeof parsed?.theme === 'string') {
        return parsed.theme;
      }
    } catch {
      // Invalid JSON, use default
    }
    return DEFAULT_THEME;
  }

  /**
   * Gets the stored theme from the default (non-namespaced) settings object in localStorage.
   * Used by static utility helpers that don't have access to a core instance.
   *
   * @returns The stored theme name if valid, or 'light' as the default
   */
  static getStoredTheme(): ThemeName {
    if (typeof localStorage === 'undefined') {
      return DEFAULT_THEME;
    }
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) {
      return DEFAULT_THEME;
    }
    try {
      const parsed = JSON.parse(stored);
      if (typeof parsed?.theme === 'string') {
        return parsed.theme;
      }
    } catch {
      // Invalid JSON, use default
    }
    return DEFAULT_THEME;
  }

  /**
   * Sets the current theme and applies it to the target element.
   * Does not persist the theme — persistence is handled by the KritzelSettings component.
   *
   * @param themeName - The theme name to set ('light' or 'dark')
   */
  setTheme(themeName: ThemeName): void {
    this._currentTheme = themeName;

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
