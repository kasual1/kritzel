import { KritzelTheme } from "kritzel-react";

export const customReactTheme: KritzelTheme = {
  name: 'react-theme',
  global: {
    primaryColor: '#087ea4',
    primaryHoverColor: '#065d7a',
    focusRingColor: 'rgba(8, 126, 164, 0.2)',
    cursorTrailColor: 'rgb(228, 228, 228)',
    cursorTrailOpacity: '0.6',
    textPrimary: '#000000',
  },
  engine: {
    backgroundColor: '#ffffff',
  },
  selection: {
    borderColor: '#087ea4',
    borderWidth: '2px',
    handleSize: '6px',
    handleColor: '#ffffff',
    handleStrokeColor: '#087ea4',
    boxBackgroundColor: 'rgba(8, 125, 164, 0.2)',
    boxBorderColor: 'rgba(8, 125, 164, 0.5)',
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
    itemHoverBackgroundColor: 'rgba(8, 126, 164, 0.08)',
    itemActiveBackgroundColor: 'rgba(8, 126, 164, 0.12)',
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
    controlHoverBackgroundColor: 'rgba(8, 126, 164, 0.08)',
    controlActiveBackgroundColor: 'rgba(8, 126, 164, 0.12)',
    controlSelectedBackgroundColor: '#087ea4',
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
    itemButtonHoverBackgroundColor: 'rgba(8, 126, 164, 0.08)',
    itemOverlayBackgroundColor: 'rgba(8, 126, 164, 0.08)',
    itemSelectedBackgroundColor: '#087ea4',
    itemInputSelectionColor: '#087ea4',
  },
  snap: {
    indicatorStroke: '#087ea4',
  },
  splitButton: {
    hoverBackgroundColor: 'rgba(8, 126, 164, 0.08)',
  },
  dropdown: {
    accentColor: '#087ea4',
    selectedBackgroundColor: 'rgba(8, 126, 164, 0.1)',
  },
  button: {
    primaryBackgroundColor: '#087ea4',
    primaryHoverBackgroundColor: '#065d7a',
    primaryActiveBackgroundColor: '#044d63',
  },
  slideToggle: {
    trackCheckedColor: '#087ea4',
  },
  loginDialog: {
    buttonHoverBackground: 'rgba(8, 126, 164, 0.08)',
  },
  opacitySlider: {
    activeColor: '#087ea4',
    thumbColor: '#087ea4',
  },
  moreMenu: {
    buttonHoverBackgroundColor: 'rgba(8, 126, 164, 0.08)',
    buttonActiveBackgroundColor: 'rgba(8, 126, 164, 0.12)',
  },
  masterDetail: {
    menuItemHoverBackgroundColor: 'rgba(8, 126, 164, 0.08)',
    menuItemActiveBackgroundColor: 'rgba(8, 126, 164, 0.12)',
    menuItemSelectedBackgroundColor: 'rgba(8, 126, 164, 0.1)',
    menuItemSelectedHoverBackgroundColor: 'rgba(8, 126, 164, 0.15)',
    menuItemSelectedColor: '#087ea4',
  },
  textInput: {
    focusBorderColor: '#087ea4',
  },
  numericInput: {
    focusBorderColor: '#087ea4',
  },
};
