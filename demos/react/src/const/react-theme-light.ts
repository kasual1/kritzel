import { KritzelTheme } from "@kritzel/react-editor";

export const reactThemeLight: KritzelTheme = {
  name: 'light',
  global: {
    primaryColor: '#0959a4',
    primaryHoverColor: '#07437c',
    focusRingColor: 'rgba(9, 89, 164, 0.2)',
    cursorTrailColor: 'rgb(228, 228, 228)',
    cursorTrailOpacity: '0.6',
    textPrimary: '#000000',
  },
  engine: {
    backgroundColor: '#ffffff',
  },
  selection: {
    borderColor: '#0959a4',
    borderWidth: '2px',
    handleSize: '6px',
    handleColor: '#ffffff',
    handleStrokeColor: '#0959a4',
    boxBackgroundColor: 'rgba(9, 89, 164, 0.2)',
    boxBorderColor: 'rgba(9, 89, 164, 0.5)',
  },
  contextMenu: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1px 6px rgba(0, 0, 0, 0.12)',
    border: '1px solid #ebebeb',
    padding: '4px',
    itemGap: '8px',
    itemPadding: '8px',
    itemBorderRadius: '12px',
    itemColor: '#333333',
    itemFontSize: '14px',
    itemHoverBackgroundColor: 'rgba(9, 89, 164, 0.08)',
    itemActiveBackgroundColor: 'rgba(9, 89, 164, 0.12)',
    itemDisabledColor: '#aaaaaa',
  },
  toolbar: {
    boxShadow: '0 0 3px rgba(0, 0, 0, 0.08)',
    border: '1px solid #ebebeb',
    borderRadius: '16px',
    backgroundColor: '#ffffff',
    padding: '8px',
    gap: '8px',
    controlColor: '#000',
    controlBorderRadius: '12px',
    controlPadding: '8px',
    controlHoverBackgroundColor: 'rgba(9, 89, 164, 0.08)',
    controlActiveBackgroundColor: 'rgba(9, 89, 164, 0.12)',
    controlSelectedBackgroundColor: '#0959a4',
    controlSelectedColor: '#ffffff',
    separatorColor: '#ebebeb'
  },
  tooltip: {
    backgroundColor: '#fff',
    color: '#000',
    borderRadius: '16px',
    padding: '8px',
    boxShadow: '0 1px 6px rgba(0, 0, 0, 0.12)',
  },
  colorPalette: {
    hoverBackgroundColor: '#ebebeb',
    circleBorderColor: '#dddcdc',
    selectedBackgroundColor: '#ebebeb',
  },
  strokeSize: {
    hoverBackgroundColor: '#ebebeb',
    selectedBackgroundColor: '#ebebeb',
  },
  menu: {
    itemButtonHoverBackgroundColor: 'rgba(9, 89, 164, 0.08)',
    itemOverlayBackgroundColor: 'rgba(9, 89, 164, 0.08)',
    itemSelectedBackgroundColor: '#0959a4',
    itemInputSelectionColor: '#0959a4',
  },
  snap: {
    indicatorStroke: '#0959a4',
    indicatorStrokeInactive: 'rgba(9, 89, 164, 0.5)',
    indicatorFill: 'rgba(9, 89, 164, 0.18)',
    indicatorFillInactive: 'rgba(9, 89, 164, 0.12)',
    lineStroke: 'rgba(9, 89, 164, 0.24)',
  },
  splitButton: {
    hoverBackgroundColor: 'rgba(9, 89, 164, 0.08)',
  },
  dropdown: {
    accentColor: '#0959a4',
    selectedBackgroundColor: 'rgba(9, 89, 164, 0.1)',
  },
  button: {
    primaryBackgroundColor: '#0959a4',
    primaryHoverBackgroundColor: '#07437c',
    primaryActiveBackgroundColor: '#052e55',
  },
  currentUserDialog: {
    logoutButtonBackgroundColor: '#0959a4',
    logoutButtonHoverBackgroundColor: '#07437c',
    logoutButtonActiveBackgroundColor: '#052e55',
    logoutButtonColor: '#ffffff',
  },
  slideToggle: {
    trackCheckedColor: '#0959a4',
  },
  loginDialog: {
    buttonHoverBackground: 'rgba(9, 89, 164, 0.08)',
  },
  opacitySlider: {
    activeColor: '#0959a4',
    thumbColor: '#0959a4',
  },
  moreMenu: {
    buttonHoverBackgroundColor: 'rgba(9, 89, 164, 0.08)',
    buttonActiveBackgroundColor: 'rgba(9, 89, 164, 0.12)',
  },
  masterDetail: {
    menuItemHoverBackgroundColor: 'rgba(9, 89, 164, 0.08)',
    menuItemActiveBackgroundColor: 'rgba(9, 89, 164, 0.12)',
    menuItemSelectedBackgroundColor: 'rgba(9, 89, 164, 0.1)',
    menuItemSelectedHoverBackgroundColor: 'rgba(9, 89, 164, 0.15)',
    menuItemSelectedColor: '#0959a4',
  },
  textInput: {
    focusBorderColor: '#0959a4',
  },
  numericInput: {
    focusBorderColor: '#0959a4',
  },
};
