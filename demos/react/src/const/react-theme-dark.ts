import { darkTheme, KritzelTheme } from "kritzel-react";

export const reactThemeDark: KritzelTheme = {
  ...darkTheme,
  name: 'react-theme-dark',
  global: {
    ...darkTheme.global,
    focusRingColor: 'rgba(8, 126, 164, 0.3)',
  },
  selection: {
    ...darkTheme.selection,
    borderColor: '#087ea4',
    boxBackgroundColor: 'rgba(8, 126, 164, 0.15)',
    boxBorderColor: 'rgba(8, 126, 164, 0.4)',
    handleStrokeColor: '#087ea4',
  },
  controls: {
    ...darkTheme.controls,
    controlHoverBackgroundColor: 'rgba(8, 126, 164, 0.12)',
    controlActiveBackgroundColor: 'rgba(8, 126, 164, 0.18)',
    controlSelectedBackgroundColor: '#087ea4',
  },
  contextMenu: {
    ...darkTheme.contextMenu,
    itemHoverBackgroundColor: 'rgba(8, 126, 164, 0.12)',
    itemActiveBackgroundColor: 'rgba(8, 126, 164, 0.18)',
  },
  menu: {
    ...darkTheme.menu,
    itemButtonHoverBackgroundColor: 'rgba(8, 126, 164, 0.12)',
    itemOverlayBackgroundColor: 'rgba(8, 126, 164, 0.12)',
    itemSelectedBackgroundColor: '#087ea4',
    itemInputSelectionColor: '#087ea4',
  },
  snap: {
    ...darkTheme.snap,
    indicatorStroke: '#087ea4',
    indicatorFill: 'rgba(8, 126, 164, 0.35)',
  },
  splitButton: {
    ...darkTheme.splitButton,
    hoverBackgroundColor: 'rgba(8, 126, 164, 0.12)',
  },
  dropdown: {
    ...darkTheme.dropdown,
    accentColor: '#087ea4',
    selectedBackgroundColor: 'rgba(8, 126, 164, 0.15)',
  },
  slideToggle: {
    ...darkTheme.slideToggle,
    trackCheckedColor: '#087ea4',
  },
  loginDialog: {
    ...darkTheme.loginDialog,
    buttonHoverBackground: 'rgba(8, 126, 164, 0.12)',
  },
  opacitySlider: {
    ...darkTheme.opacitySlider,
    activeColor: '#087ea4',
    thumbBorderColor: '#087ea4',
  },
  moreMenu: {
    ...darkTheme.moreMenu,
    buttonHoverBackgroundColor: 'rgba(8, 126, 164, 0.12)',
    buttonActiveBackgroundColor: 'rgba(8, 126, 164, 0.18)',
  },
  masterDetail: {
    ...darkTheme.masterDetail,
    menuItemHoverBackgroundColor: 'rgba(8, 126, 164, 0.12)',
    menuItemActiveBackgroundColor: 'rgba(8, 126, 164, 0.18)',
    menuItemSelectedBackgroundColor: '#087ea4',
    menuItemSelectedHoverBackgroundColor: '#087ea4',
    menuItemSelectedColor: '#ffffff',
  },
  textInput: {
    ...darkTheme.textInput,
    focusBorderColor: '#087ea4',
  },
  numericInput: {
    ...darkTheme.numericInput,
    focusBorderColor: '#087ea4',
  },
};
