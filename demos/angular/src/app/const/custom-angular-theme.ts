import { KritzelTheme } from "kritzel-angular";

export const customAngularTheme: KritzelTheme = {
  name: 'angular-theme',
  global: {
    primaryColor: '#dd0031',
    primaryHoverColor: '#b30027',
    focusRingColor: 'rgba(221, 0, 48, 0.2)',
    cursorTrailColor: 'rgb(228, 228, 228)',
    cursorTrailOpacity: '0.6',
    textPrimary: '#000000',
  },
  engine: {
    backgroundColor: '#ffffff',
  },
  selection: {
    borderColor: '#dd0031',
    borderWidth: '2px',
    handleSize: '6px',
    handleColor: '#ffffff',
    handleStrokeColor: '#dd0031',
    boxBackgroundColor: 'rgba(221, 0, 48, 0.2)',
    boxBorderColor: 'rgba(221, 0, 48, 0.5)',
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
    itemHoverBackgroundColor: 'rgba(221, 0, 48, 0.08)',
    itemActiveBackgroundColor: 'rgba(221, 0, 48, 0.12)',
    itemDisabledColor: '#aaaaaa',
  },
  controls: {
    boxShadow: '0 0 3px rgba(0, 0, 0, 0.08)',
    border: '1px solid #ebebeb',
    borderRadius: '16px',
    backgroundColor: '#ffffff',
    padding: '8px',
    gap: '8px',
    controlColor: '#000',
    controlBorderRadius: '12px',
    controlPadding: '8px',
    controlHoverBackgroundColor: 'rgba(221, 0, 48, 0.08)',
    controlActiveBackgroundColor: 'rgba(221, 0, 48, 0.12)',
    controlSelectedBackgroundColor: '#dd0031',
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
    itemButtonHoverBackgroundColor: 'rgba(221, 0, 48, 0.08)',
    itemOverlayBackgroundColor: 'rgba(221, 0, 48, 0.08)',
    itemSelectedBackgroundColor: '#dd0031',
    itemInputSelectionColor: '#dd0031',
  },
  snap: {
    indicatorStroke: '#dd0031',
  },
  splitButton: {
    hoverBackgroundColor: 'rgba(221, 0, 48, 0.08)',
  },
  dropdown: {
    accentColor: '#dd0031',
    selectedBackgroundColor: 'rgba(221, 0, 48, 0.1)',
  },
  button: {
    primaryBackgroundColor: '#dd0031',
    primaryHoverBackgroundColor: '#b30027',
    primaryActiveBackgroundColor: '#8c001f',
  },
  slideToggle: {
    trackCheckedColor: '#dd0031',
  },
  loginDialog: {
    buttonHoverBackground: 'rgba(221, 0, 48, 0.08)',
  },
  opacitySlider: {
    activeColor: '#dd0031',
    thumbColor: '#dd0031',
  },
  moreMenu: {
    buttonHoverBackgroundColor: 'rgba(221, 0, 48, 0.08)',
    buttonActiveBackgroundColor: 'rgba(221, 0, 48, 0.12)',
  },
  masterDetail: {
    menuItemHoverBackgroundColor: 'rgba(221, 0, 48, 0.08)',
    menuItemActiveBackgroundColor: 'rgba(221, 0, 48, 0.12)',
    menuItemSelectedBackgroundColor: 'rgba(221, 0, 48, 0.1)',
    menuItemSelectedHoverBackgroundColor: 'rgba(221, 0, 48, 0.15)',
    menuItemSelectedColor: '#dd0031',
  },
  textInput: {
    focusBorderColor: '#dd0031',
  },
  numericInput: {
    focusBorderColor: '#dd0031',
  },
};
