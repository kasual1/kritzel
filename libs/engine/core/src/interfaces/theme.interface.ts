/**
 * Theme name type for available themes
 */
export type ThemeName = 'light' | 'dark' | (string & NonNullable<unknown>);

/**
 * Complete theme definition with all CSS variable values grouped by category
 */
export interface KritzelTheme {
  /** Theme identifier */
  name: ThemeName;

  /** Global variables */
  global?: {
    agenticCursorFontFamily?: string;
    agenticCursorLabelFontSize?: string;
    agenticCursorLabelTextColor?: string;
    agenticCursorStatusBackgroundColor?: string;
    agenticCursorStatusFontSize?: string;
    agenticCursorStatusMaxWidth?: string;
    agenticCursorStatusTextColor?: string;
    cursorTrailColor?: string;
    cursorTrailOpacity?: string;
    dividerColor?: string;
    focusColor?: string;
    borderColor?: string;
    defaultCursor?: string;
    focusRingColor?: string;
    fontFamily?: string;
    iconColor?: string;
    pointerCursor?: string;
    primaryColor?: string;
    primaryHoverColor?: string;
    primaryTextColor?: string;
    scrollbarThumbColor?: string;
    textPrimary?: string;
    textSecondary?: string;
    iframeDefaultCursor?: string;
    iframePointerCursor?: string;
    name?: string;
  };

  /** Active users variables */
  activeUsers?: {
    avatarBorderColor?: string;
    fontFamily?: string;
    overflowColor?: string;
    overflowFontSize?: string;
    tooltipBackground?: string;
    tooltipColor?: string;
  };

  /** Avatar variables */
  avatar?: {
    border?: string;
    defaultBackground?: string;
    defaultColor?: string;
    initialsColor?: string;
    initialsFontFamily?: string;
    initialsFontWeight?: string;
  };

  /** Awareness variables */
  awareness?: {
    cursorLabelFontSize?: string;
    cursorLabelTextColor?: string;
    cursorTransitionDuration?: string;
    fontFamily?: string;
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

  /** Button variables */
  button?: {
    borderRadius?: string;
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    padding?: string;
    primaryActiveBackgroundColor?: string;
    primaryBackgroundColor?: string;
    primaryColor?: string;
    primaryHoverBackgroundColor?: string;
    secondaryActiveBackgroundColor?: string;
    secondaryBackgroundColor?: string;
    secondaryColor?: string;
    secondaryHoverBackgroundColor?: string;
    textActiveBackgroundColor?: string;
    textColor?: string;
    textHoverBackgroundColor?: string;
    width?: string;
  };

  /** Chat box variables */
  chatBox?: {
    backgroundColor?: string;
    border?: string;
    borderRadius?: string;
    boxShadow?: string;
    buttonBackgroundColor?: string;
    buttonColor?: string;
    buttonHoverBackgroundColor?: string;
    caretColor?: string;
    caretWidth?: string;
    fontSize?: string;
    inputBackgroundColor?: string;
    inputBorderRadius?: string;
    inputMinHeight?: string;
    padding?: string;
    placeholderColor?: string;
    scrollbarThumbColor?: string;
    selectionBackgroundColor?: string;
    selectionColor?: string;
    textColor?: string;
    width?: string;
  };

  /** Checkerboard variables */
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
    dividerColor?: string;
    dividerMargin?: string;
    fontFamily?: string;
    itemActiveBackgroundColor?: string;
    itemBorderRadius?: string;
    itemColor?: string;
    itemDisabledColor?: string;
    itemFontSize?: string;
    itemGap?: string;
    itemHoverBackgroundColor?: string;
    itemPadding?: string;
    itemSpacing?: string;
    minWidth?: string;
    padding?: string;
  };

  /** Current user dialog variables */
  currentUserDialog?: {
    emailColor?: string;
    logoutButtonActiveBackgroundColor?: string;
    logoutButtonBackgroundColor?: string;
    logoutButtonColor?: string;
    logoutButtonHoverBackgroundColor?: string;
    nameColor?: string;
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
    background?: string;
    borderColor?: string;
    borderRadius?: string;
    hoverBackgroundColor?: string;
    hoverBorderColor?: string;
    menuBorderRadius?: string;
    selectedBackgroundColor?: string;
    textColor?: string;
    triggerFontSize?: string;
    triggerPadding?: string;
  };

  /** Editor variables */
  editor?: {
    loadingOverlayBackground?: string;
    loadingOverlayColor?: string;
    loadingOverlaySpinnerActiveColor?: string;
    loadingOverlaySpinnerColor?: string;
    loadingOverlayZIndex?: string;
    notificationAnimationDuration?: string;
    notificationAnimationEasing?: string;
    notificationDismissAnimationDuration?: string;
    notificationDismissAnimationEasing?: string;
    toolbarBottom?: string;
    toolbarTransform?: string;
    toolbarTransition?: string;
    toolbarTransitionDuration?: string;
    topCenterNotificationTop?: string;
    topCenterNotificationZIndex?: string;
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

  /** Login dialog variables */
  loginDialog?: {
    buttonActiveBackground?: string;
    buttonBackground?: string;
    buttonBorderColor?: string;
    buttonHoverBackground?: string;
    buttonHoverBorderColor?: string;
    buttonTextColor?: string;
    spinnerActiveColor?: string;
    spinnerColor?: string;
    subtitleColor?: string;
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
    fontFamily?: string;
    gap?: string;
    itemBorderRadius?: string;
    itemButtonHoverBackgroundColor?: string;
    itemChildOpenBackgroundColor?: string;
    itemColor?: string;
    itemEditingBackgroundColor?: string;
    itemFontSize?: string;
    itemHeight?: string;
    itemInputBorder?: string;
    itemInputBorderColorOnSelected?: string;
    itemInputCaretColor?: string;
    itemInputCaretColorOnSelected?: string;
    itemInputHeight?: string;
    itemInputSelectionColor?: string;
    itemInputSelectionColorOnSelected?: string;
    itemInputSelectionTextColor?: string;
    itemInputSelectionTextColorOnSelected?: string;
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
    backgroundColor?: string;
    border?: string;
    borderRadius?: string;
    boxShadow?: string;
    buttonActiveBackgroundColor?: string;
    buttonColor?: string;
    buttonHeight?: string;
    buttonHoverBackgroundColor?: string;
    buttonWidth?: string;
    innerBorderRadius?: string;
    padding?: string;
  };

  /** Notification card variables */
  notificationCard?: {
    backgroundColor?: string;
    border?: string;
    borderRadius?: string;
    boxShadow?: string;
    color?: string;
    dismissButtonActiveBackgroundColor?: string;
    dismissButtonBackgroundColor?: string;
    dismissButtonBorderRadius?: string;
    dismissButtonColor?: string;
    dismissButtonHoverBackgroundColor?: string;
    dismissButtonSize?: string;
    errorPillBackgroundColor?: string;
    errorPillColor?: string;
    headerGap?: string;
    headerMarginBottom?: string;
    headerRightGap?: string;
    infoPillBackgroundColor?: string;
    infoPillColor?: string;
    maxWidth?: string;
    messageColor?: string;
    messageFontSize?: string;
    messageLineHeight?: string;
    padding?: string;
    pillBackgroundColor?: string;
    pillBorderRadius?: string;
    pillColor?: string;
    pillFontSize?: string;
    pillFontWeight?: string;
    pillHeight?: string;
    pillPadding?: string;
    timestampColor?: string;
    timestampFontSize?: string;
    warningPillBackgroundColor?: string;
    warningPillColor?: string;
  };

  /** Numeric input variables */
  numericInput?: {
    borderColor?: string;
    borderRadius?: string;
    focusBorderColor?: string;
    hoverBorderColor?: string;
    inputBackground?: string;
    labelColor?: string;
    selectionBackground?: string;
    selectionColor?: string;
    spinnerActiveBackground?: string;
    spinnerBackground?: string;
    spinnerBorderRadius?: string;
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

  /** Pill tabs variables */
  pillTabs?: {
    background?: string;
    borderRadius?: string;
    tabBackground?: string;
    tabBackgroundHover?: string;
    tabBackgroundSelected?: string;
    tabBorderRadius?: string;
    tabLabelMaxWidth?: string;
    tabShadowSelected?: string;
    tabTextColor?: string;
    tabTextColorSelected?: string;
  };

  /** Portal variables */
  portal?: {
    maxHeight?: string;
  };

  /** Selection variables */
  selection?: {
    borderColor?: string;
    borderWidth?: string;
    boxBackgroundColor?: string;
    boxBorderColor?: string;
    handleColor?: string;
    handleSize?: string;
    handleStrokeColor?: string;
  };

  /** Settings variables */
  settings?: {
    contentHeadingColor?: string;
    contentTextColor?: string;
    descriptionColor?: string;
    labelColor?: string;
    shortcutItemBg?: string;
    shortcutKeyBg?: string;
    shortcutKeyBorder?: string;
    shortcutKeyColor?: string;
  };

  /** Shape fill variables */
  shapeFill?: {
    hoverBackgroundColor?: string;
    optionBackground?: string;
    selectedBackgroundColor?: string;
  };

  /** Share dialog variables */
  shareDialog?: {
    borderColor?: string;
    copyButtonBackground?: string;
    copyButtonColor?: string;
    copyButtonHoverBackground?: string;
    copyButtonHoverColor?: string;
    copySuccessBackground?: string;
    copySuccessColor?: string;
    descriptionColor?: string;
    inputBackground?: string;
    inputBorderColor?: string;
    inputTextColor?: string;
    labelColor?: string;
    qrBackground?: string;
    qrBorderColor?: string;
    revokeButtonBorderColor?: string;
    revokeButtonColor?: string;
    revokeButtonHoverBackground?: string;
    revokeButtonHoverColor?: string;
    selectionColor?: string;
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

  /** Snap variables */
  snap?: {
    indicatorFill?: string;
    indicatorFillInactive?: string;
    indicatorStroke?: string;
    indicatorStrokeInactive?: string;
    lineStroke?: string;
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

  /** Text input variables */
  textInput?: {
    background?: string;
    borderColor?: string;
    borderRadius?: string;
    focusBorderColor?: string;
    hoverBorderColor?: string;
    labelColor?: string;
    placeholderColor?: string;
    selectionBackground?: string;
    selectionColor?: string;
    suffixBackground?: string;
    suffixColor?: string;
    textColor?: string;
  };

  /** Titlebar variables */
  titlebar?: {
    activeBackgroundColor?: string;
    activeBorder?: string;
    activeBoxShadow?: string;
    activeButtonFilledBackgroundColor?: string;
    activeIconColor?: string;
    activeMutedTextColor?: string;
    activeTextColor?: string;
    backgroundColor?: string;
    border?: string;
    borderRadius?: string;
    boxShadow?: string;
    buttonBorderRadius?: string;
    buttonFilledBackgroundColor?: string;
    buttonFilledColor?: string;
    buttonHoverBackgroundColor?: string;
    buttonOutlineColor?: string;
    buttonPressedBackgroundColor?: string;
    buttonSize?: string;
    focusRing?: string;
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    gap?: string;
    height?: string;
    hoverBackgroundColor?: string;
    iconColor?: string;
    iconSize?: string;
    inputBackgroundColor?: string;
    mutedTextColor?: string;
    offset?: string;
    paddingX?: string;
    textColor?: string;
    titleFontWeight?: string;
    transition?: string;
  };

  /** Toolbar variables */
  toolbar?: {
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
    separatorColor?: string;
  };

  /** Tooltip variables */
  tooltip?: {
    backgroundColor?: string;
    border?: string;
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

  /** Watermark variables */
  watermark?: {
    background?: string;
    borderRadius?: string;
    boxShadow?: string;
    color?: string;
    fontSize?: string;
    offsetBottom?: string;
    offsetRight?: string;
    opacity?: string;
  };

  /** Zoom panel variables */
  zoomPanel?: {
    backgroundColor?: string;
    border?: string;
    borderRadius?: string;
    boxShadow?: string;
    buttonActiveBackgroundColor?: string;
    buttonBorderRadius?: string;
    buttonHoverBackgroundColor?: string;
    buttonSize?: string;
    gap?: string;
    iconColor?: string;
    padding?: string;
  };
}