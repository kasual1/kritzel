import type { KritzelTheme } from "kritzel-vue";

export const vueThemeLight: KritzelTheme = {
  name: 'light',
  global: {
    primaryColor: '#42b883',
    primaryHoverColor: '#369a6e',
    focusRingColor: 'rgba(66, 184, 131, 0.2)',
    cursorTrailColor: 'rgb(228, 228, 228)',
    cursorTrailOpacity: '0.6',
    textPrimary: '#000000',
  },
  engine: {
    backgroundColor: '#ffffff',
  },
  selection: {
    borderColor: '#42b883',
    borderWidth: '2px',
    handleSize: '6px',
    handleColor: '#ffffff',
    handleStrokeColor: '#42b883',
    boxBackgroundColor: 'rgba(66, 184, 131, 0.2)',
    boxBorderColor: 'rgba(66, 184, 131, 0.5)',
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
    itemHoverBackgroundColor: 'rgba(66, 184, 131, 0.08)',
    itemActiveBackgroundColor: 'rgba(66, 184, 131, 0.12)',
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
    controlHoverBackgroundColor: 'rgba(66, 184, 131, 0.08)',
    controlActiveBackgroundColor: 'rgba(66, 184, 131, 0.12)',
    controlSelectedBackgroundColor: '#42b883',
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
    itemButtonHoverBackgroundColor: 'rgba(66, 184, 131, 0.08)',
    itemOverlayBackgroundColor: 'rgba(66, 184, 131, 0.08)',
    itemSelectedBackgroundColor: '#42b883',
    itemInputSelectionColor: '#42b883',
  },
  snap: {
    indicatorStroke: '#42b883',
    indicatorStrokeInactive: 'rgba(66, 184, 131, 0.5)',
    indicatorFill: 'rgba(66, 184, 131, 0.18)',
    indicatorFillInactive: 'rgba(66, 184, 131, 0.12)',
    lineStroke: 'rgba(66, 184, 131, 0.24)',
  },
  splitButton: {
    hoverBackgroundColor: 'rgba(66, 184, 131, 0.08)',
  },
  dropdown: {
    accentColor: '#42b883',
    selectedBackgroundColor: 'rgba(66, 184, 131, 0.1)',
  },
  button: {
    primaryBackgroundColor: '#42b883',
    primaryHoverBackgroundColor: '#369a6e',
    primaryActiveBackgroundColor: '#2c7d5a',
  },
  slideToggle: {
    trackCheckedColor: '#42b883',
  },
  loginDialog: {
    buttonHoverBackground: 'rgba(66, 184, 131, 0.08)',
  },
  opacitySlider: {
    activeColor: '#42b883',
    thumbColor: '#42b883',
  },
  moreMenu: {
    buttonHoverBackgroundColor: 'rgba(66, 184, 131, 0.08)',
    buttonActiveBackgroundColor: 'rgba(66, 184, 131, 0.12)',
  },
  masterDetail: {
    menuItemHoverBackgroundColor: 'rgba(66, 184, 131, 0.08)',
    menuItemActiveBackgroundColor: 'rgba(66, 184, 131, 0.12)',
    menuItemSelectedBackgroundColor: 'rgba(66, 184, 131, 0.1)',
    menuItemSelectedHoverBackgroundColor: 'rgba(66, 184, 131, 0.15)',
    menuItemSelectedColor: '#42b883',
  },
  textInput: {
    focusBorderColor: '#42b883',
  },
  numericInput: {
    focusBorderColor: '#42b883',
  },
};
