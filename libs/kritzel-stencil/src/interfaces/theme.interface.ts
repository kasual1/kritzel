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

  /** Global variables */
  global?: {
    backgroundSecondary?: string;
    borderColor?: string;
    dividerColor?: string;
    focusColor?: string;
    focusRingColor?: string;
    pointerCursor?: string;
    hoverBackground?: string;
    iconColor?: string;
    primaryColor?: string;
    selectionBorderColor?: string;
    textPrimary?: string;
    textSecondary?: string;
  };

  /** Back to content variables */
  backToContent?: {
    activeBackgroundColor?: string;
    backgroundColor?: string;
    border?: string;
    borderRadius?: string;
    boxShadow?: string;
    color?: string;
    fontSize?: string;
    fontWeight?: string;
    gap?: string;
    height?: string;
    hoverBackgroundColor?: string;
    padding?: string;
    zIndex?: string;
  };

  /** Checkerboard variables (for transparency preview) */
  checkerboard?: {
    colorDark?: string;
    colorLight?: string;
  };

  /** Color palette variables */
  colorPalette?: {
    circleBorderColor?: string;
    hoverBackgroundColor?: string;
    selectedBackgroundColor?: string;
  };

  /** Context menu variables */
  contextMenu?: {
    backgroundColor?: string;
    border?: string;
    borderRadius?: string;
    boxShadow?: string;
    itemActiveBackgroundColor?: string;
    itemBorderRadius?: string;
    itemColor?: string;
    itemDisabledColor?: string;
    itemFontSize?: string;
    itemGap?: string;
    itemHoverBackgroundColor?: string;
    itemPadding?: string;
    padding?: string;
  };

  /** Controls variables */
  controls?: {
    backgroundColor?: string;
    border?: string;
    borderRadius?: string;
    boxShadow?: string;
    controlActiveBackgroundColor?: string;
    controlBorderRadius?: string;
    controlColor?: string;
    controlHoverBackgroundColor?: string;
    controlPadding?: string;
    controlSelectedBackgroundColor?: string;
    controlSelectedColor?: string;
    gap?: string;
    padding?: string;
    textColor?: string;
  };

  /** Dialog variables */
  dialog?: {
    backdropColor?: string;
    backgroundColor?: string;
    bodyPadding?: string;
    border?: string;
    borderRadius?: string;
    boxShadow?: string;
    closeButtonActiveBackground?: string;
    closeButtonBackground?: string;
    closeButtonBorderRadius?: string;
    closeButtonColor?: string;
    closeButtonHoverBackground?: string;
    closeButtonHoverColor?: string;
    fontFamily?: string;
    footerBorder?: string;
    footerGap?: string;
    footerPadding?: string;
    headerBorder?: string;
    headerPadding?: string;
    heightLarge?: string;
    heightMedium?: string;
    heightSmall?: string;
    maxHeight?: string;
    maxWidth?: string;
    titleColor?: string;
    titleFontSize?: string;
    titleFontWeight?: string;
    widthLarge?: string;
    widthMedium?: string;
    widthSmall?: string;
  };

  /** Dropdown variables */
  dropdown?: {
    accentColor?: string;
    hoverBackgroundColor?: string;
    selectedBackgroundColor?: string;
    textColor?: string;
  };

  /** Editor variables */
  editor?: {
    controlsBottom?: string;
    controlsTransform?: string;
    controlsTransition?: string;
    controlsTransitionDuration?: string;
    topLeftButtonsLeft?: string;
    topLeftButtonsTop?: string;
    topRightButtonsRight?: string;
    topRightButtonsTop?: string;
  };

  /** Engine variables */
  engine?: {
    backgroundColor?: string;
  };

  /** Font size variables */
  fontSize?: {
    hoverBackgroundColor?: string;
    selectedBackgroundColor?: string;
    textColor?: string;
  };

  /** Line endings variables */
  lineEndings?: {
    hoverBackgroundColor?: string;
    labelColor?: string;
    optionBackground?: string;
    selectedBackgroundColor?: string;
  };

  /** Master detail variables */
  masterDetail?: {
    backButtonColor?: string;
    backgroundColor?: string;
    detailBackgroundColor?: string;
    detailFocusOutline?: string;
    detailFocusOutlineOffset?: string;
    detailPadding?: string;
    gap?: string;
    menuBackgroundColor?: string;
    menuBorderRight?: string;
    menuGap?: string;
    menuItemActiveBackgroundColor?: string;
    menuItemBackgroundColor?: string;
    menuItemBorderRadius?: string;
    menuItemChevronColor?: string;
    menuItemColor?: string;
    menuItemDisabledColor?: string;
    menuItemFocusOutline?: string;
    menuItemFocusOutlineOffset?: string;
    menuItemFontSize?: string;
    menuItemFontWeight?: string;
    menuItemGap?: string;
    menuItemHoverBackgroundColor?: string;
    menuItemPadding?: string;
    menuItemSelectedBackgroundColor?: string;
    menuItemSelectedColor?: string;
    menuItemSelectedFontWeight?: string;
    menuItemSelectedHoverBackgroundColor?: string;
    menuMinWidth?: string;
    menuPadding?: string;
    menuWidth?: string;
    minHeight?: string;
  };

  /** Menu variables */
  menu?: {
    backgroundColor?: string;
    border?: string;
    borderRadius?: string;
    boxShadow?: string;
    gap?: string;
    itemBorderRadius?: string;
    itemButtonHoverBackgroundColor?: string;
    itemChildOpenBackgroundColor?: string;
    itemColor?: string;
    itemEditingBackgroundColor?: string;
    itemFontSize?: string;
    itemHeight?: string;
    itemInputBorder?: string;
    itemInputHeight?: string;
    itemInputSelectionColor?: string;
    itemInputSelectionTextColor?: string;
    itemMinHeight?: string;
    itemOverlayBackgroundColor?: string;
    itemPadding?: string;
    itemSelectedBackgroundColor?: string;
    itemSelectedColor?: string;
    padding?: string;
    width?: string;
  };

  /** More menu variables */
  moreMenu?: {
    buttonActiveBackgroundColor?: string;
    buttonBackgroundColor?: string;
    buttonBorder?: string;
    buttonBorderRadius?: string;
    buttonBoxShadow?: string;
    buttonColor?: string;
    buttonHeight?: string;
    buttonHoverBackgroundColor?: string;
    buttonWidth?: string;
  };

  /** Numeric input variables */
  numericInput?: {
    backgroundColor?: string;
    borderColor?: string;
    focusBorderColor?: string;
    hoverBorderColor?: string;
    labelColor?: string;
    spinnerActiveBackground?: string;
    spinnerBackground?: string;
    spinnerColor?: string;
    spinnerHoverBackground?: string;
    textColor?: string;
  };

  /** Opacity slider variables */
  opacitySlider?: {
    activeColor?: string;
    thumbBorderColor?: string;
    thumbColor?: string;
    trackColor?: string;
  };

  /** Portal variables */
  portal?: {
    maxHeight?: string;
  };

  /** Settings variables */
  settings?: {
    contentHeadingColor?: string;
    contentTextColor?: string;
    descriptionColor?: string;
    labelColor?: string;
  };

  /** Shape fill variables */
  shapeFill?: {
    hoverBackgroundColor?: string;
    optionBackground?: string;
    selectedBackgroundColor?: string;
  };

  /** Slide toggle variables */
  slideToggle?: {
    borderRadius?: string;
    height?: string;
    thumbColor?: string;
    thumbSize?: string;
    trackCheckedColor?: string;
    trackColor?: string;
    transitionDuration?: string;
    width?: string;
  };

  /** Split button variables */
  splitButton?: {
    backgroundColor?: string;
    border?: string;
    borderRadius?: string;
    boxShadow?: string;
    color?: string;
    dividerBackgroundColor?: string;
    dividerWidth?: string;
    fontSize?: string;
    gap?: string;
    hoverBackgroundColor?: string;
    padding?: string;
  };

  /** Stroke size variables */
  strokeSize?: {
    hoverBackgroundColor?: string;
    selectedBackgroundColor?: string;
  };

  /** Submenu variables */
  submenu?: {
    gap?: string;
  };

  /** Tooltip variables */
  tooltip?: {
    backgroundColor?: string;
    borderRadius?: string;
    boxShadow?: string;
    color?: string;
    padding?: string;
  };

  /** Utility panel variables */
  utilityPanel?: {
    backgroundColor?: string;
    buttonBorderRadius?: string;
    buttonColor?: string;
    buttonHoverBackgroundColor?: string;
    separatorColor?: string;
  };
}