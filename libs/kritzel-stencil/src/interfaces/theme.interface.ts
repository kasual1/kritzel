/**
 * Theme name type for available themes
 */
export type ThemeName = 'light' | 'dark';

/**
 * Complete theme definition with all CSS variable values grouped by category
 */
export interface KritzelTheme {
  /** Theme identifier */
  name: ThemeName;

  /** Global/shared variables */
  global: {
    pointerCursor: string;
    focusRingColor: string;
    focusColor: string;
    iconColor: string;
    dividerColor: string;
    selectionBorderColor: string;
  };

  /** Canvas/engine variables */
  engine: {
    backgroundColor: string;
  };

  /** Controls/toolbar variables */
  controls: {
    gap: string;
    padding: string;
    backgroundColor: string;
    borderRadius: string;
    boxShadow: string;
    border: string;
    controlColor: string;
    controlBorderRadius: string;
    controlPadding: string;
    controlHoverBackgroundColor: string;
    controlActiveBackgroundColor: string;
    controlSelectedBackgroundColor: string;
    controlSelectedColor: string;
    controlTextColor: string;
  };

  /** Tooltip variables */
  tooltip: {
    backgroundColor: string;
    color: string;
    padding: string;
    borderRadius: string;
    boxShadow: string;
  };

  /** Context menu variables */
  contextMenu: {
    backgroundColor: string;
    borderRadius: string;
    boxShadow: string;
    border: string;
    padding: string;
    itemGap: string;
    itemPadding: string;
    itemBorderRadius: string;
    itemFontSize: string;
    itemColor: string;
    itemHoverBackgroundColor: string;
    itemActiveBackgroundColor: string;
    itemDisabledColor: string;
  };

  /** Menu variables */
  menu: {
    backgroundColor: string;
    width: string;
    padding: string;
    borderRadius: string;
    boxShadow: string;
    border: string;
    gap: string;
    itemPadding: string;
    itemHeight: string;
    itemMinHeight: string;
    itemFontSize: string;
    itemColor: string;
    itemBorderRadius: string;
    itemHoverBackgroundColor: string;
    itemSelectedBackgroundColor: string;
    itemSelectedColor: string;
    itemInputSelectionColor: string;
  };

  /** Slide toggle variables */
  slideToggle: {
    width: string;
    height: string;
    trackColor: string;
    trackColorChecked: string;
    borderRadius: string;
    transitionDuration: string;
    thumbSize: string;
    thumbColor: string;
  };

  /** Split button variables */
  splitButton: {
    padding: string;
    backgroundColor: string;
    borderRadius: string;
    boxShadow: string;
    border: string;
    gap: string;
    hoverBackgroundColor: string;
    dividerWidth: string;
    fontSize: string;
  };

  /** Dropdown variables */
  dropdown: {
    color: string;
    hoverBackgroundColor: string;
    selectedBackgroundColor: string;
    accentColor: string;
  };

  /** Opacity slider variables */
  opacitySlider: {
    filledColor: string;
    emptyColor: string;
    thumbColor: string;
    thumbBorderColor: string;
  };

  /** Stroke size variables */
  strokeSize: {
    hoverBackgroundColor: string;
    selectedBackgroundColor: string;
  };

  /** Line endings variables */
  lineEndings: {
    labelColor: string;
    optionBackgroundColor: string;
    hoverBackgroundColor: string;
    selectedBackgroundColor: string;
  };

  /** Utility panel variables */
  utilityPanel: {
    buttonBorderRadius: string;
  };

  /** Color palette variables */
  colorPalette: {
    hoverBackgroundColor: string;
    whiteCircleBorderColor: string;
  };

  /** Submenu variables */
  submenu: {
    gap: string;
  };

  /** Portal variables */
  portal: {
    maxHeight: string;
  };
}
