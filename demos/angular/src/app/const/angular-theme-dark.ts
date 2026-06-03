import { darkTheme, KritzelTheme } from "kritzel-angular";

export const angularThemeDark: KritzelTheme = {
  ...darkTheme,
  name: 'angular-theme-dark',
  global: {
    ...darkTheme.global,
    focusRingColor: 'rgba(255, 64, 129, 0.3)',
  },
  selection: {
    ...darkTheme.selection,
    borderColor: '#ff4081',
    boxBackgroundColor: 'rgba(255, 64, 129, 0.15)',
    boxBorderColor: 'rgba(255, 64, 129, 0.4)',
    handleStrokeColor: '#ff4081',
  },
  controls: {
    ...darkTheme.controls,
    controlHoverBackgroundColor: 'rgba(255, 64, 129, 0.12)',
    controlActiveBackgroundColor: 'rgba(255, 64, 129, 0.18)',
    controlSelectedBackgroundColor: '#ff4081',
  },
  contextMenu: {
    ...darkTheme.contextMenu,
    itemHoverBackgroundColor: 'rgba(255, 64, 129, 0.12)',
    itemActiveBackgroundColor: 'rgba(255, 64, 129, 0.18)',
  },
  menu: {
    ...darkTheme.menu,
    itemButtonHoverBackgroundColor: 'rgba(255, 64, 129, 0.12)',
    itemOverlayBackgroundColor: 'rgba(255, 64, 129, 0.12)',
    itemSelectedBackgroundColor: '#ff4081',
    itemInputSelectionColor: '#ff4081',
  },
  snap: {
    ...darkTheme.snap,
    indicatorStroke: '#ff4081',
    indicatorFill: 'rgba(255, 64, 129, 0.35)',
  },
  splitButton: {
    ...darkTheme.splitButton,
    hoverBackgroundColor: 'rgba(255, 64, 129, 0.12)',
  },
  dropdown: {
    ...darkTheme.dropdown,
    accentColor: '#ff4081',
    selectedBackgroundColor: 'rgba(255, 64, 129, 0.15)',
  },
  slideToggle: {
    ...darkTheme.slideToggle,
    trackCheckedColor: '#ff4081',
  },
  loginDialog: {
    ...darkTheme.loginDialog,
    buttonHoverBackground: 'rgba(255, 64, 129, 0.12)',
  },
  opacitySlider: {
    ...darkTheme.opacitySlider,
    activeColor: '#ff4081',
    thumbBorderColor: '#ff4081',
  },
  moreMenu: {
    ...darkTheme.moreMenu,
    buttonHoverBackgroundColor: 'rgba(255, 64, 129, 0.12)',
    buttonActiveBackgroundColor: 'rgba(255, 64, 129, 0.18)',
  },
  masterDetail: {
    ...darkTheme.masterDetail,
    menuItemHoverBackgroundColor: 'rgba(255, 64, 129, 0.12)',
    menuItemActiveBackgroundColor: 'rgba(255, 64, 129, 0.18)',
    menuItemSelectedBackgroundColor: '#ff4081',
    menuItemSelectedHoverBackgroundColor: '#ff4081',
    menuItemSelectedColor: '#ffffff',
  },
  textInput: {
    ...darkTheme.textInput,
    focusBorderColor: '#ff4081',
  },
  numericInput: {
    ...darkTheme.numericInput,
    focusBorderColor: '#ff4081',
  },
};

