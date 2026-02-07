import { KritzelTheme } from '../interfaces/theme.interface';

/**
 * Dark theme preset
 */
export const darkTheme: KritzelTheme = {
  name: 'dark',

  global: {
    borderColor: '#3a3a3a',
    dividerColor: '#3a3a3a',
    focusColor: '#4da3ff',
    focusRingColor: 'rgba(0, 122, 255, 0.4)',
    pointerCursor: 'pointer',
    hoverBackground: 'hsl(0, 0%, 100%, 8%)',
    iconColor: 'currentColor',
    scrollbarThumbColor: '#555555',
    textPrimary: '#ffffff',
    textSecondary: '#e0e0e0',
  },

  selection: {
    borderColor: '#0A84FF',
    handleColor: '#1a1a1a',
  },

  checkerboard: {
    colorDark: '#4a4a4a',
    colorLight: '#3a3a3a',
  },

  backToContent: {
    activeBackgroundColor: 'hsl(0, 0%, 100%, 12%)',
    backgroundColor: '#2a2a2a',
    border: '1px solid #3a3a3a',
    boxShadow: '0 0 6px rgba(0, 0, 0, 0.3)',
    color: '#ffffff',
    hoverBackgroundColor: 'hsl(0, 0%, 100%, 8%)',
  },

  colorPalette: {
    circleBorderColor: '#4a4a4a',
    hoverBackgroundColor: '#3a3a3a',
    selectedBackgroundColor: '#3a3a3a',
  },

  contextMenu: {
    backgroundColor: '#2a2a2a',
    border: '1px solid #3a3a3a',
    borderRadius: '12px',
    boxShadow: '0 1px 8px rgba(0, 0, 0, 0.4)',
    itemActiveBackgroundColor: 'hsl(0, 0%, 100%, 12%)',
    itemBorderRadius: '12px',
    itemColor: '#e0e0e0',
    itemDisabledColor: '#666666',
    itemFontSize: '14px',
    itemGap: '8px',
    itemHoverBackgroundColor: 'hsl(0, 0%, 100%, 8%)',
    itemPadding: '8px',
    padding: '4px',
  },

  controls: {
    backgroundColor: '#2a2a2a',
    border: '1px solid #3a3a3a',
    boxShadow: '0 0 6px rgba(0, 0, 0, 0.3)',
    controlActiveBackgroundColor: 'hsl(0, 0%, 100%, 12%)',
    controlColor: '#ffffff',
    controlHoverBackgroundColor: 'hsl(0, 0%, 100%, 8%)',
    controlSelectedBackgroundColor: '#0A84FF',
    controlSelectedColor: '#ffffff',
  },

  dialog: {
    backdropColor: 'rgba(0, 0, 0, 0.6)',
    backgroundColor: '#2a2a2a',
    bodyPadding: '16px',
    border: '1px solid #3a3a3a',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.5)',
    closeButtonActiveBackground: 'hsl(0, 0%, 100%, 12%)',
    closeButtonBackground: 'transparent',
    closeButtonColor: '#e0e0e0',
    closeButtonHoverBackground: 'hsl(0, 0%, 100%, 8%)',
    closeButtonHoverColor: '#ffffff',
    footerBorder: '1px solid #3a3a3a',
    headerBorder: '1px solid #3a3a3a',
    titleColor: '#ffffff',
    titleFontSize: '18px',
    titleFontWeight: '600',
  },

  dropdown: {
    accentColor: '#0A84FF',
    hoverBackgroundColor: '#3a3a3a',
    selectedBackgroundColor: 'rgba(10, 132, 255, 0.2)',
    textColor: '#e0e0e0',
  },

  editor: {
    controlsBottom: '16px',
    controlsTransform: 'translateX(-50%)',
    controlsTransition: 'opacity 0.2s ease',
    controlsTransitionDuration: '0.2s',
    topLeftButtonsLeft: '16px',
    topLeftButtonsTop: '16px',
    topRightButtonsRight: '16px',
    topRightButtonsTop: '16px',
  },

  engine: {
    backgroundColor: '#1a1a1a',
  },

  fontSize: {
    hoverBackgroundColor: '#3a3a3a',
    selectedBackgroundColor: '#3a3a3a',
    textColor: '#e0e0e0',
  },

  lineEndings: {
    hoverBackgroundColor: '#3a3a3a',
    labelColor: '#999999',
    optionBackground: '#2a2a2a',
    selectedBackgroundColor: '#3a3a3a',
  },

  masterDetail: {
    backButtonColor: '#e0e0e0',
    backgroundColor: '#2a2a2a',
    detailBackgroundColor: '#2a2a2a',
    detailFocusOutline: '2px solid #0A84FF',
    menuBackgroundColor: '#2a2a2a',
    menuBorderRight: '1px solid #3a3a3a',
    menuItemActiveBackgroundColor: 'hsl(0, 0%, 100%, 12%)',
    menuItemBackgroundColor: 'transparent',
    menuItemChevronColor: '#666666',
    menuItemColor: '#e0e0e0',
    menuItemDisabledColor: '#666666',
    menuItemFocusOutline: '2px solid #0A84FF',
    menuItemHoverBackgroundColor: 'hsl(0, 0%, 100%, 8%)',
    menuItemSelectedBackgroundColor: '#0A84FF',
    menuItemSelectedColor: '#ffffff',
    menuItemSelectedHoverBackgroundColor: '#0A84FF',
  },

  menu: {
    backgroundColor: '#2a2a2a',
    border: '1px solid #3a3a3a',
    borderRadius: '12px',
    boxShadow: '0 0 6px rgba(0, 0, 0, 0.3)',
    gap: '4px',
    itemBorderRadius: '12px',
    itemButtonHoverBackgroundColor: 'hsl(0, 0%, 100%, 8%)',
    itemChildOpenBackgroundColor: 'hsl(0, 0%, 100%, 6%)',
    itemColor: '#e0e0e0',
    itemEditingBackgroundColor: '#3a3a3a',
    itemFontSize: '14px',
    itemHeight: '40px',
    itemInputBorder: '1px solid #4a4a4a',
    itemInputHeight: '32px',
    itemInputSelectionColor: 'rgba(255, 255, 255, 0.2)',
    itemInputSelectionTextColor: '#ffffff',
    itemMinHeight: '40px',
    itemOverlayBackgroundColor: 'hsl(0, 0%, 0%, 20%)',
    itemPadding: '8px',
    itemSelectedBackgroundColor: '#0A84FF',
    itemSelectedColor: '#ffffff',
    padding: '8px',
    width: '200px',
  },

  moreMenu: {
    buttonActiveBackgroundColor: '#444444',
    buttonBackgroundColor: '#2a2a2a',
    buttonBorder: '1px solid #3a3a3a',
    buttonBorderRadius: '12px',
    buttonBoxShadow: '0 0 6px rgba(0, 0, 0, 0.3)',
    buttonColor: '#ffffff',
    buttonHoverBackgroundColor: '#3b3b3b',
  },

  numericInput: {
    borderColor: '#3a3a3a',
    focusBorderColor: '#0A84FF',
    hoverBorderColor: '#4a4a4a',
    inputBackground: '#1a1a1a',
    labelColor: '#999999',
    spinnerActiveBackground: 'hsl(0, 0%, 100%, 12%)',
    spinnerBackground: 'transparent',
    spinnerColor: '#e0e0e0',
    spinnerHoverBackground: 'hsl(0, 0%, 100%, 8%)',
    textColor: '#e0e0e0',
  },

  opacitySlider: {
    activeColor: '#0A84FF',
    thumbBorderColor: '#0A84FF',
    thumbColor: '#ffffff',
    trackColor: '#4a4a4a',
  },

  portal: {
    maxHeight: '300px',
  },

  settings: {
    contentHeadingColor: '#ffffff',
    contentTextColor: '#e0e0e0',
    descriptionColor: '#999999',
    labelColor: '#e0e0e0',
  },

  shapeFill: {
    hoverBackgroundColor: '#3a3a3a',
    optionBackground: '#2a2a2a',
    selectedBackgroundColor: '#3a3a3a',
  },

  slideToggle: {
    borderRadius: '11px',
    height: '22px',
    thumbColor: '#ffffff',
    thumbSize: '18px',
    trackCheckedColor: '#0A84FF',
    trackColor: '#4a4a4a',
    transitionDuration: '0.2s',
    width: '40px',
  },

  splitButton: {
    backgroundColor: '#2a2a2a',
    border: '1px solid #3a3a3a',
    boxShadow: '0 0 6px rgba(0, 0, 0, 0.3)',
    color: '#ffffff',
    dividerBackgroundColor: '#3a3a3a',
    hoverBackgroundColor: 'hsl(0, 0%, 100%, 8%)',
  },

  strokeSize: {
    hoverBackgroundColor: '#3a3a3a',
    selectedBackgroundColor: '#3a3a3a',
  },

  submenu: {
    gap: '4px',
  },

  tooltip: {
    backgroundColor: '#2a2a2a',
    border: '1px solid #3a3a3a',
    borderRadius: '16px',
    boxShadow: '0 1px 8px rgba(0, 0, 0, 0.4)',
    color: '#ffffff',
    padding: '12px',
  },

  utilityPanel: {
    backgroundColor: '#3a3a3a',
    buttonBorderRadius: '8px',
    buttonColor: '#e0e0e0',
    buttonHoverBackgroundColor: 'hsl(0, 0%, 100%, 8%)',
    separatorColor: 'hsl(0, 0%, 100%, 12%)',
  },
};
