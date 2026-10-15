import { KritzelTheme } from '../interfaces/theme.interface';

/**
 * Light theme preset - the default theme
 */
export const lightTheme: KritzelTheme = {
  name: 'light',

  global: {
    borderColor: '#ebebeb',
    dividerColor: '#e0e0e0',
    focusColor: '#333333',
    focusRingColor: '#333333',
    fontFamily: 'sans-serif',
    iconColor: 'currentColor',
    scrollbarThumbColor: '#ebebeb',
    textPrimary: '#000000',
    textSecondary: '#333333',
  },

  pillTabs: {
    background: '#f0f0f0',
    tabBackground: 'transparent',
    tabBackgroundHover: 'rgba(0, 0, 0, 0.05)',
    tabBackgroundSelected: '#ffffff',
    tabLabelMaxWidth: '10rem',
    tabShadowSelected: '0 1px 3px rgba(0, 0, 0, 0.1)',
    tabTextColor: '#666666',
    tabTextColorSelected: '#000000',
  },

  textInput: {
    background: '#ffffff',
    borderColor: '#dbdbdb',
    borderRadius: '6px',
    focusBorderColor: '#333333',
    hoverBorderColor: '#cccccc',
    labelColor: '#333333',
    placeholderColor: '#999999',
    selectionBackground: '#4A7DFF',
    selectionColor: '#ffffff',
    suffixBackground: '#f5f5f5',
    suffixColor: '#666666',
    textColor: '#333333',
  },

  selection: {
    borderColor: '#4A7DFF',
    boxBackgroundColor: 'rgba(74, 125, 255, 0.2)',
    boxBorderColor: 'rgba(74, 125, 255, 0.5)',
    handleColor: '#ffffff',
    handleStrokeColor: '#4A7DFF'
  },

  checkerboard: {
    colorDark: '#cccccc',
    colorLight: '#ffffff',
  },

  backToContent: {
    activeBackgroundColor: 'hsl(0, 0%, 0%, 8.6%)',
    backgroundColor: '#ffffff',
    border: '1px solid #ebebeb',
    boxShadow: '0 0 3px rgba(0, 0, 0, 0.08)',
    color: '#000000',
    hoverBackgroundColor: 'hsl(0, 0%, 0%, 4.3%)',
  },

  colorPalette: {
    circleBorderColor: '#dddcdc',
    hoverBackgroundColor: '#ebebeb',
    selectedBackgroundColor: '#ebebeb',
  },

  contextMenu: {
    backgroundColor: '#ffffff',
    border: '1px solid #ebebeb',
    boxShadow: '0 1px 6px rgba(0, 0, 0, 0.12)',
    dividerColor: 'rgba(0, 0, 0, 0.1)',
    itemActiveBackgroundColor: 'hsl(0, 0%, 0%, 8.6%)',
    itemColor: '#333333',
    itemDisabledColor: '#aaaaaa',
    itemHoverBackgroundColor: 'hsl(0, 0%, 0%, 4.3%)',
  },

  toolbar: {
    backgroundColor: '#ffffff',
    border: '1px solid #ebebeb',
    boxShadow: '0 0 3px rgba(0, 0, 0, 0.08)',
    controlActiveBackgroundColor: 'hsl(0, 0%, 0%, 8.6%)',
    controlColor: '#000000',
    controlHoverBackgroundColor: 'hsl(0, 0%, 0%, 4.3%)',
    controlSelectedBackgroundColor: '#4A7DFF',
    controlSelectedColor: '#ffffff',
    separatorColor: '#ebebeb',
  },

  currentUserDialog: {
    emailColor: '#666666',
    nameColor: '#333333',
  },

  dialog: {
    backdropColor: 'rgba(0, 0, 0, 0.4)',
    backgroundColor: '#ffffff',
    border: '1px solid #ebebeb',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
    closeButtonActiveBackground: 'hsl(0, 0%, 0%, 8.6%)',
    closeButtonBackground: 'transparent',
    closeButtonColor: '#333333',
    closeButtonHoverBackground: 'hsl(0, 0%, 0%, 4.3%)',
    closeButtonHoverColor: '#000000',
    footerBorder: '1px solid #ebebeb',
    headerBorder: '1px solid #ebebeb',
    titleColor: '#000000',
  },

  loginDialog: {
    buttonActiveBackground: '#ebebeb',
    buttonBackground: '#ffffff',
    buttonBorderColor: '#e0e0e0',
    buttonHoverBackground: '#f5f5f5',
    buttonHoverBorderColor: '#cccccc',
    buttonTextColor: '#333333',
    spinnerActiveColor: '#333333',
    spinnerColor: '#cccccc',
    subtitleColor: '#666666',
  },

  dropdown: {
    accentColor: '#4A7DFF',
    background: '#ffffff',
    borderColor: '#dbdbdb',
    borderRadius: '6px',
    hoverBorderColor: '#cccccc',
    hoverBackgroundColor: '#f0f0f0',
    menuBorderRadius: '6px',
    selectedBackgroundColor: '#4A7DFF1A',
    textColor: '#333333',
  },

  engine: {
    backgroundColor: '#ffffff',
  },

  editor: {
    loadingOverlayBackground: 'rgba(255, 255, 255, 0.85)',
    loadingOverlayColor: '#333333',
    loadingOverlaySpinnerActiveColor: '#333333',
    loadingOverlaySpinnerColor: '#cccccc',
  },

  snap: {
    indicatorFill: 'rgba(74, 125, 255, 0.3)',
    indicatorFillInactive: 'rgba(74, 125, 255, 0.18)',
    indicatorStroke: '#4A7DFF',
    indicatorStrokeInactive: 'rgba(74, 125, 255, 0.5)',
    lineStroke: 'rgba(0, 0, 0, 0.2)',
  },

  fontSize: {
    hoverBackgroundColor: '#ebebeb',
    selectedBackgroundColor: '#ebebeb',
    textColor: '#333333',
  },

  lineEndings: {
    hoverBackgroundColor: '#ebebeb',
    labelColor: '#666666',
    optionBackground: '#ffffff',
    selectedBackgroundColor: '#ebebeb',
  },

  masterDetail: {
    backButtonColor: '#333333',
    backgroundColor: '#ffffff',
    detailBackgroundColor: '#ffffff',
    detailFocusOutline: '2px solid #333333',
    menuBackgroundColor: '#ffffff',
    menuBorderRight: '1px solid #ebebeb',
    menuItemActiveBackgroundColor: 'hsl(0, 0%, 0%, 8.6%)',
    menuItemBackgroundColor: 'transparent',
    menuItemChevronColor: '#aaaaaa',
    menuItemColor: '#333333',
    menuItemDisabledColor: '#aaaaaa',
    menuItemFocusOutline: '2px solid #333333',
    menuItemHoverBackgroundColor: 'hsl(0, 0%, 0%, 4.3%)',
    menuItemSelectedBackgroundColor: '#4A7DFF',
    menuItemSelectedColor: '#ffffff',
    menuItemSelectedHoverBackgroundColor: '#4A7DFF',
  },

  menu: {
    backgroundColor: '#ffffff',
    border: '1px solid #ebebeb',
    boxShadow: '0 0 3px rgba(0, 0, 0, 0.08)',
    itemButtonHoverBackgroundColor: 'hsl(0, 0%, 0%, 4.3%)',
    itemChildOpenBackgroundColor: 'hsl(0, 0%, 0%, 3%)',
    itemColor: '#333333',
    itemEditingBackgroundColor: '#f0f0f0',
    itemInputBorder: '1px solid #333333',
    itemInputBorderColorOnSelected: '#ffffff',
    itemInputCaretColor: '#333333',
    itemInputCaretColorOnSelected: '#ffffff',
    itemInputSelectionColor: '#4A7DFF',
    itemInputSelectionColorOnSelected: 'rgba(255, 255, 255, 0.55)',
    itemInputSelectionTextColor: '#ffffff',
    itemInputSelectionTextColorOnSelected: '#ffffff',
    itemOverlayBackgroundColor: 'hsl(0, 0%, 0%, 4.3%)',
    itemSelectedBackgroundColor: '#4A7DFF',
    itemSelectedColor: '#ffffff',
  },

  moreMenu: {
    backgroundColor: '#ffffff',
    border: '1px solid #ebebeb',
    borderRadius: '12px',
    boxShadow: '0 0 3px rgba(0, 0, 0, 0.08)',
    buttonActiveBackgroundColor: 'hsl(0, 0%, 0%, 8.6%)',
    buttonColor: '#000000',
    buttonHoverBackgroundColor: 'hsl(0, 0%, 0%, 4.3%)',
    innerBorderRadius: '12px',
  },

  notificationCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)',
    color: '#111827',
    dismissButtonActiveBackgroundColor: '#e5e7eb',
    dismissButtonBackgroundColor: 'transparent',
    dismissButtonBorderRadius: '6px',
    dismissButtonColor: '#4b5563',
    dismissButtonHoverBackgroundColor: '#f3f4f6',
    dismissButtonSize: '24px',
    errorPillBackgroundColor: '#fef2f2',
    errorPillColor: '#b91c1c',
    headerGap: '8px',
    headerMarginBottom: '8px',
    headerRightGap: '6px',
    infoPillBackgroundColor: '#eff6ff',
    infoPillColor: '#1d4ed8',
    maxWidth: '360px',
    messageColor: 'inherit',
    messageFontSize: '14px',
    messageLineHeight: '1.45',
    padding: '12px 14px',
    pillBackgroundColor: '#eff6ff',
    pillBorderRadius: '999px',
    pillColor: '#1d4ed8',
    pillFontSize: '12px',
    pillFontWeight: '600',
    pillHeight: '22px',
    pillPadding: '0 8px',
    timestampColor: '#6b7280',
    timestampFontSize: '12px',
    warningPillBackgroundColor: '#fff7ed',
    warningPillColor: '#b45309',
  },

  numericInput: {
    focusBorderColor: '#333333',
    borderColor: '#dbdbdb',
    borderRadius: '6px',
    hoverBorderColor: '#cccccc',
    inputBackground: '#ffffff',
    labelColor: '#666666',
    selectionBackground: '#4A7DFF',
    selectionColor: '#ffffff',
    spinnerActiveBackground: 'hsl(0, 0%, 0%, 8.6%)',
    spinnerBackground: 'transparent',
    spinnerBorderRadius: '5px',
    spinnerColor: '#333333',
    spinnerHoverBackground: 'hsl(0, 0%, 0%, 4.3%)',
    textColor: '#333333',
  },

  opacitySlider: {
    activeColor: '#4A7DFF',
    thumbBorderColor: '#4A7DFF',
    thumbColor: '#ffffff',
    trackColor: '#e0e0e0',
  },

  settings: {
    contentHeadingColor: '#000000',
    contentTextColor: '#333333',
    descriptionColor: '#666666',
    labelColor: '#333333',
    shortcutItemBg: '#f8f8f8',
    shortcutKeyBg: '#ffffff',
    shortcutKeyBorder: '#e0e0e0',
    shortcutKeyColor: '#555555',
  },

  shapeFill: {
    hoverBackgroundColor: '#ebebeb',
    optionBackground: '#ffffff',
    selectedBackgroundColor: '#ebebeb',
  },

  shareDialog: {
    borderColor: '#e5e5e5',
    copyButtonBackground: '#ffffff',
    copyButtonColor: '#666666',
    copyButtonHoverBackground: '#e8e8e8',
    copyButtonHoverColor: '#333333',
    copySuccessBackground: '#d4edda',
    copySuccessColor: '#28a745',
    descriptionColor: '#666666',
    inputBackground: '#f5f5f5',
    inputBorderColor: '#e0e0e0',
    inputTextColor: '#333333',
    labelColor: '#333333',
    revokeButtonBorderColor: '#dc3545',
    revokeButtonColor: '#dc3545',
    revokeButtonHoverBackground: '#dc3545',
    revokeButtonHoverColor: '#ffffff',
    selectionColor: '#cce5ff',
  },

  slideToggle: {
    thumbColor: '#fff',
    thumbSize: '18px',
    trackCheckedColor: '#4A7DFF',
    trackColor: '#ccc',
  },

  splitButton: {
    backgroundColor: '#ffffff',
    border: '1px solid #ebebeb',
    boxShadow: '0 0 3px rgba(0, 0, 0, 0.08)',
    color: '#000000',
    dividerBackgroundColor: '#ebebeb',
    hoverBackgroundColor: 'hsl(0, 0%, 0%, 4.3%)',
  },

  strokeSize: {
    hoverBackgroundColor: '#ebebeb',
    selectedBackgroundColor: '#ebebeb',
  },

  tooltip: {
    backgroundColor: '#ffffff',
    border: '1px solid #ebebeb',
    boxShadow: '0 1px 6px rgba(0, 0, 0, 0.12)',
    color: '#000000',
  },

  utilityPanel: {
    backgroundColor: '#e2e2e2',
    buttonColor: '#333333',
    buttonHoverBackgroundColor: 'hsl(0, 0%, 0%, 4.3%)',
    separatorColor: 'hsl(0, 0%, 0%, 8%)',
  },



  watermark: {
    background: 'rgba(255, 255, 255, 0.6)',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.12)',
    color: 'rgba(60, 60, 60, 0.75)',
  },

  chatBox: {
    backgroundColor: '#ffffff',
    border: '1px solid #e4e4e7',
    borderRadius: '20px',
    boxShadow: '0 4px 8px rgba(20, 18, 31, 0.04), 0 18px 36px -14px rgba(20, 18, 31, 0.2)',
    buttonBackgroundColor: '#4A7DFF',
    buttonColor: '#ffffff',
    buttonHoverBackgroundColor: '#3A6AE8',
    caretColor: '#4A7DFF',
    caretWidth: '2px',
    selectionBackgroundColor: '#4A7DFF',
    selectionColor: '#ffffff',
    scrollbarThumbColor: '#d4d4d4',
    fontSize: '15px',
    inputBackgroundColor: '#f3f4f6',
    inputBorderRadius: '14px',
    inputMinHeight: '88px',
    padding: '6px',
    placeholderColor: '#9ca3af',
    textColor: '#0a0a0a',
    width: '480px',
  },

  zoomPanel: {
    backgroundColor: '#ffffff',
    border: '1px solid #ebebeb',
    borderRadius: '12px',
    boxShadow: '0 0 3px rgba(0, 0, 0, 0.08)',
    buttonActiveBackgroundColor: 'hsl(0, 0%, 0%, 8.6%)',
    buttonBorderRadius: '8px',
    buttonHoverBackgroundColor: 'hsl(0, 0%, 0%, 4.3%)',
    buttonSize: '32px',
    gap: '4px',
    iconColor: '#000000',
    padding: '4px',
  },
};
