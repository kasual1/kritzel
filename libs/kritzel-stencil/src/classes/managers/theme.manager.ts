import { KritzelTheme, ThemeName } from '../../interfaces/theme.interface';
import { lightTheme } from '../../themes/light-theme';
import { darkTheme } from '../../themes/dark-theme';
import { KritzelCore } from '../core/core.class';

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
    void this._core; // Reserved for future use (e.g., theme change events)
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
   */
  applyTheme(themeName: ThemeName): void {
    if (!this._targetElement) {
      return;
    }

    const theme = this.getThemeByName(themeName);
    const element = this._targetElement;

    // Global variables
    element.style.setProperty('--kritzel-pointer-cursor', theme.global.pointerCursor);
    element.style.setProperty('--kritzel-focus-ring-color', theme.global.focusRingColor);
    element.style.setProperty('--kritzel-focus-color', theme.global.focusColor);
    element.style.setProperty('--kritzel-icon-color', theme.global.iconColor);
    element.style.setProperty('--kritzel-divider-color', theme.global.dividerColor);
    element.style.setProperty('--kritzel-selection-border-color', theme.global.selectionBorderColor);

    // Engine variables
    element.style.setProperty('--kritzel-engine-background-color', theme.engine.backgroundColor);

    // Controls variables
    element.style.setProperty('--kritzel-controls-gap', theme.controls.gap);
    element.style.setProperty('--kritzel-controls-padding', theme.controls.padding);
    element.style.setProperty('--kritzel-controls-background-color', theme.controls.backgroundColor);
    element.style.setProperty('--kritzel-controls-border-radius', theme.controls.borderRadius);
    element.style.setProperty('--kritzel-controls-box-shadow', theme.controls.boxShadow);
    element.style.setProperty('--kritzel-controls-border', theme.controls.border);
    element.style.setProperty('--kritzel-controls-control-color', theme.controls.controlColor);
    element.style.setProperty('--kritzel-controls-control-border-radius', theme.controls.controlBorderRadius);
    element.style.setProperty('--kritzel-controls-control-padding', theme.controls.controlPadding);
    element.style.setProperty('--kritzel-controls-control-hover-background-color', theme.controls.controlHoverBackgroundColor);
    element.style.setProperty('--kritzel-controls-control-active-background-color', theme.controls.controlActiveBackgroundColor);
    element.style.setProperty('--kritzel-controls-control-selected-background-color', theme.controls.controlSelectedBackgroundColor);
    element.style.setProperty('--kritzel-controls-control-selected-color', theme.controls.controlSelectedColor);
    element.style.setProperty('--kritzel-controls-control-text-color', theme.controls.controlTextColor);

    // Tooltip variables
    element.style.setProperty('--kritzel-controls-tooltip-background-color', theme.tooltip.backgroundColor);
    element.style.setProperty('--kritzel-controls-tooltip-color', theme.tooltip.color);
    element.style.setProperty('--kritzel-controls-tooltip-padding', theme.tooltip.padding);
    element.style.setProperty('--kritzel-controls-tooltip-border-radius', theme.tooltip.borderRadius);
    element.style.setProperty('--kritzel-controls-tooltip-box-shadow', theme.tooltip.boxShadow);

    // Context menu variables
    element.style.setProperty('--kritzel-context-menu-background-color', theme.contextMenu.backgroundColor);
    element.style.setProperty('--kritzel-context-menu-border-radius', theme.contextMenu.borderRadius);
    element.style.setProperty('--kritzel-context-menu-box-shadow', theme.contextMenu.boxShadow);
    element.style.setProperty('--kritzel-context-menu-border', theme.contextMenu.border);
    element.style.setProperty('--kritzel-context-menu-padding', theme.contextMenu.padding);
    element.style.setProperty('--kritzel-context-menu-item-gap', theme.contextMenu.itemGap);
    element.style.setProperty('--kritzel-context-menu-item-padding', theme.contextMenu.itemPadding);
    element.style.setProperty('--kritzel-context-menu-item-border-radius', theme.contextMenu.itemBorderRadius);
    element.style.setProperty('--kritzel-context-menu-item-font-size', theme.contextMenu.itemFontSize);
    element.style.setProperty('--kritzel-context-menu-item-color', theme.contextMenu.itemColor);
    element.style.setProperty('--kritzel-context-menu-item-hover-background-color', theme.contextMenu.itemHoverBackgroundColor);
    element.style.setProperty('--kritzel-context-menu-item-active-background-color', theme.contextMenu.itemActiveBackgroundColor);
    element.style.setProperty('--kritzel-context-menu-item-disabled-color', theme.contextMenu.itemDisabledColor);

    // Menu variables
    element.style.setProperty('--kritzel-menu-background-color', theme.menu.backgroundColor);
    element.style.setProperty('--kritzel-menu-width', theme.menu.width);
    element.style.setProperty('--kritzel-menu-padding', theme.menu.padding);
    element.style.setProperty('--kritzel-menu-border-radius', theme.menu.borderRadius);
    element.style.setProperty('--kritzel-menu-box-shadow', theme.menu.boxShadow);
    element.style.setProperty('--kritzel-menu-border', theme.menu.border);
    element.style.setProperty('--kritzel-menu-gap', theme.menu.gap);
    element.style.setProperty('--kritzel-menu-item-padding', theme.menu.itemPadding);
    element.style.setProperty('--kritzel-menu-item-height', theme.menu.itemHeight);
    element.style.setProperty('--kritzel-menu-item-min-height', theme.menu.itemMinHeight);
    element.style.setProperty('--kritzel-menu-item-font-size', theme.menu.itemFontSize);
    element.style.setProperty('--kritzel-menu-item-color', theme.menu.itemColor);
    element.style.setProperty('--kritzel-menu-item-border-radius', theme.menu.itemBorderRadius);
    element.style.setProperty('--kritzel-menu-item-hover-background-color', theme.menu.itemHoverBackgroundColor);
    element.style.setProperty('--kritzel-menu-item-selected-bg', theme.menu.itemSelectedBackgroundColor);
    element.style.setProperty('--kritzel-menu-item-selected-color', theme.menu.itemSelectedColor);
    element.style.setProperty('--kritzel-menu-item-input-selection-color', theme.menu.itemInputSelectionColor);

    // Slide toggle variables
    element.style.setProperty('--kritzel-slide-toggle-width', theme.slideToggle.width);
    element.style.setProperty('--kritzel-slide-toggle-height', theme.slideToggle.height);
    element.style.setProperty('--kritzel-slide-toggle-track-color', theme.slideToggle.trackColor);
    element.style.setProperty('--kritzel-slide-toggle-track-color-checked', theme.slideToggle.trackColorChecked);
    element.style.setProperty('--kritzel-slide-toggle-border-radius', theme.slideToggle.borderRadius);
    element.style.setProperty('--kritzel-slide-toggle-transition-duration', theme.slideToggle.transitionDuration);
    element.style.setProperty('--kritzel-slide-toggle-thumb-size', theme.slideToggle.thumbSize);
    element.style.setProperty('--kritzel-slide-toggle-thumb-color', theme.slideToggle.thumbColor);

    // Split button variables
    element.style.setProperty('--kritzel-split-button-padding', theme.splitButton.padding);
    element.style.setProperty('--kritzel-split-button-background-color', theme.splitButton.backgroundColor);
    element.style.setProperty('--kritzel-split-button-border-radius', theme.splitButton.borderRadius);
    element.style.setProperty('--kritzel-split-button-box-shadow', theme.splitButton.boxShadow);
    element.style.setProperty('--kritzel-split-button-border', theme.splitButton.border);
    element.style.setProperty('--kritzel-split-button-gap', theme.splitButton.gap);
    element.style.setProperty('--kritzel-split-button-hover-background-color', theme.splitButton.hoverBackgroundColor);
    element.style.setProperty('--kritzel-split-button-divider-width', theme.splitButton.dividerWidth);
    element.style.setProperty('--kritzel-split-button-font-size', theme.splitButton.fontSize);

    // Dropdown variables
    element.style.setProperty('--kritzel-dropdown-color', theme.dropdown.color);
    element.style.setProperty('--kritzel-dropdown-hover-bg', theme.dropdown.hoverBackgroundColor);
    element.style.setProperty('--kritzel-dropdown-selected-bg', theme.dropdown.selectedBackgroundColor);
    element.style.setProperty('--kritzel-dropdown-accent-color', theme.dropdown.accentColor);

    // Opacity slider variables
    element.style.setProperty('--kritzel-opacity-slider-filled-color', theme.opacitySlider.filledColor);
    element.style.setProperty('--kritzel-opacity-slider-empty-color', theme.opacitySlider.emptyColor);
    element.style.setProperty('--kritzel-opacity-slider-thumb-color', theme.opacitySlider.thumbColor);
    element.style.setProperty('--kritzel-opacity-slider-thumb-border-color', theme.opacitySlider.thumbBorderColor);

    // Stroke size variables
    element.style.setProperty('--kritzel-stroke-size-hover-background-color', theme.strokeSize.hoverBackgroundColor);
    element.style.setProperty('--kritzel-stroke-size-selected-background-color', theme.strokeSize.selectedBackgroundColor);

    // Line endings variables
    element.style.setProperty('--kritzel-line-endings-label-color', theme.lineEndings.labelColor);
    element.style.setProperty('--kritzel-line-endings-option-background', theme.lineEndings.optionBackgroundColor);
    element.style.setProperty('--kritzel-line-endings-hover-background-color', theme.lineEndings.hoverBackgroundColor);
    element.style.setProperty('--kritzel-line-endings-selected-background-color', theme.lineEndings.selectedBackgroundColor);

    // Utility panel variables
    element.style.setProperty('--kritzel-utility-panel-button-border-radius', theme.utilityPanel.buttonBorderRadius);

    // Color palette variables
    element.style.setProperty('--kritzel-color-palette-hover-background-color', theme.colorPalette.hoverBackgroundColor);
    element.style.setProperty('--kritzel-color-palette-white-circle-border-color', theme.colorPalette.whiteCircleBorderColor);

    // Submenu variables
    element.style.setProperty('--kritzel-submenu-gap', theme.submenu.gap);

    // Portal variables
    element.style.setProperty('--kritzel-portal-max-height', theme.portal.maxHeight);
  }

  /**
   * Cleans up theme manager state.
   */
  cleanup(): void {
    this._targetElement = null;
  }
}
