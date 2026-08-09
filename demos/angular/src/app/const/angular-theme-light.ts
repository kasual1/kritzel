import { lightTheme, KritzelTheme } from "kritzel-angular";

export const angularThemeLight: KritzelTheme = {
  ...lightTheme,
  name: 'light',
  global: {
    ...lightTheme.global,
    primaryColor: '#dd0031',
    primaryHoverColor: '#b70028',
    primaryTextColor: '#ffffff',
    focusRingColor: 'rgba(221, 0, 48, 0.2)',
  },
  selection: {
    ...lightTheme.selection,
    borderColor: '#dd0031',
    handleStrokeColor: '#dd0031',
    boxBackgroundColor: 'rgba(221, 0, 48, 0.2)',
    boxBorderColor: 'rgba(221, 0, 48, 0.5)',
  },
  contextMenu: {
    ...lightTheme.contextMenu,
    itemHoverBackgroundColor: 'rgba(221, 0, 48, 0.08)',
    itemActiveBackgroundColor: 'rgba(221, 0, 48, 0.12)',
  },
  controls: {
    ...lightTheme.controls,
    controlHoverBackgroundColor: 'rgba(221, 0, 48, 0.08)',
    controlActiveBackgroundColor: 'rgba(221, 0, 48, 0.12)',
    controlSelectedBackgroundColor: '#dd0031',
  },
  menu: {
    ...lightTheme.menu,
    itemButtonHoverBackgroundColor: 'rgba(221, 0, 48, 0.08)',
    itemOverlayBackgroundColor: 'rgba(221, 0, 48, 0.08)',
    itemSelectedBackgroundColor: '#dd0031',
    itemInputSelectionColor: '#dd0031',
  },
  snap: {
    ...lightTheme.snap,
    indicatorStroke: '#dd0031',
    indicatorStrokeInactive: 'rgba(221, 0, 48, 0.5)',
    indicatorFill: 'rgba(221, 0, 48, 0.16)',
    indicatorFillInactive: 'rgba(221, 0, 48, 0.1)',
    lineStroke: 'rgba(221, 0, 48, 0.24)',
  },
  splitButton: {
    ...lightTheme.splitButton,
    hoverBackgroundColor: 'rgba(221, 0, 48, 0.08)',
  },
  dropdown: {
    ...lightTheme.dropdown,
    accentColor: '#dd0031',
    selectedBackgroundColor: 'rgba(221, 0, 48, 0.1)',
  },
  slideToggle: {
    ...lightTheme.slideToggle,
    trackCheckedColor: '#dd0031',
  },
  loginDialog: {
    ...lightTheme.loginDialog,
    buttonHoverBackground: 'rgba(221, 0, 48, 0.08)',
  },
  opacitySlider: {
    ...lightTheme.opacitySlider,
    activeColor: '#dd0031',
    thumbBorderColor: '#dd0031',
  },
  moreMenu: {
    ...lightTheme.moreMenu,
    buttonHoverBackgroundColor: 'rgba(221, 0, 48, 0.08)',
    buttonActiveBackgroundColor: 'rgba(221, 0, 48, 0.12)',
  },
  masterDetail: {
    ...lightTheme.masterDetail,
    menuItemHoverBackgroundColor: 'rgba(221, 0, 48, 0.08)',
    menuItemActiveBackgroundColor: 'rgba(221, 0, 48, 0.12)',
    menuItemSelectedBackgroundColor: 'rgba(221, 0, 48, 0.1)',
    menuItemSelectedHoverBackgroundColor: 'rgba(221, 0, 48, 0.15)',
    menuItemSelectedColor: '#dd0031',
  },
  textInput: {
    ...lightTheme.textInput,
    focusBorderColor: '#dd0031',
  },
  numericInput: {
    ...lightTheme.numericInput,
    focusBorderColor: '#dd0031',
  },
};
