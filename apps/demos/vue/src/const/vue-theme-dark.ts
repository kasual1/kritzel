import { darkTheme, type KritzelTheme } from "@kritzel/vue-editor";

export const vueThemeDark: KritzelTheme = {
  ...darkTheme,
  name: 'dark',
  global: {
    ...darkTheme.global,
    focusRingColor: 'rgba(66, 184, 131, 0.3)',
  },
  currentUserDialog: {
    ...darkTheme.currentUserDialog,
    logoutButtonBackgroundColor: '#42b883',
    logoutButtonHoverBackgroundColor: '#369a6e',
    logoutButtonActiveBackgroundColor: '#2c7d5a',
    logoutButtonColor: '#ffffff',
  },
  selection: {
    ...darkTheme.selection,
    borderColor: '#42b883',
    boxBackgroundColor: 'rgba(66, 184, 131, 0.15)',
    boxBorderColor: 'rgba(66, 184, 131, 0.4)',
    handleStrokeColor: '#42b883',
  },
  toolbar: {
    ...darkTheme.toolbar,
    controlHoverBackgroundColor: 'rgba(66, 184, 131, 0.12)',
    controlActiveBackgroundColor: 'rgba(66, 184, 131, 0.18)',
    controlSelectedBackgroundColor: '#42b883',
  },
  contextMenu: {
    ...darkTheme.contextMenu,
    itemHoverBackgroundColor: 'rgba(66, 184, 131, 0.12)',
    itemActiveBackgroundColor: 'rgba(66, 184, 131, 0.18)',
  },
  menu: {
    ...darkTheme.menu,
    itemButtonHoverBackgroundColor: 'rgba(66, 184, 131, 0.12)',
    itemOverlayBackgroundColor: 'rgba(66, 184, 131, 0.12)',
    itemSelectedBackgroundColor: '#42b883',
    itemInputSelectionColor: '#42b883',
  },
  snap: {
    ...darkTheme.snap,
    indicatorStroke: '#42b883',
    indicatorStrokeInactive: 'rgba(255, 255, 255, 0.45)',
    indicatorFill: 'rgba(66, 184, 131, 0.35)',
    indicatorFillInactive: 'rgba(66, 184, 131, 0.2)',
    lineStroke: 'rgba(66, 184, 131, 0.28)',
  },
  splitButton: {
    ...darkTheme.splitButton,
    hoverBackgroundColor: 'rgba(66, 184, 131, 0.12)',
  },
  dropdown: {
    ...darkTheme.dropdown,
    accentColor: '#42b883',
    selectedBackgroundColor: 'rgba(66, 184, 131, 0.15)',
  },
  slideToggle: {
    ...darkTheme.slideToggle,
    trackCheckedColor: '#42b883',
  },
  loginDialog: {
    ...darkTheme.loginDialog,
    buttonHoverBackground: 'rgba(66, 184, 131, 0.12)',
  },
  opacitySlider: {
    ...darkTheme.opacitySlider,
    activeColor: '#42b883',
    thumbBorderColor: '#42b883',
  },
  moreMenu: {
    ...darkTheme.moreMenu,
    buttonHoverBackgroundColor: 'rgba(66, 184, 131, 0.12)',
    buttonActiveBackgroundColor: 'rgba(66, 184, 131, 0.18)',
  },
  masterDetail: {
    ...darkTheme.masterDetail,
    menuItemHoverBackgroundColor: 'rgba(66, 184, 131, 0.12)',
    menuItemActiveBackgroundColor: 'rgba(66, 184, 131, 0.18)',
    menuItemSelectedBackgroundColor: '#42b883',
    menuItemSelectedHoverBackgroundColor: '#42b883',
    menuItemSelectedColor: '#ffffff',
  },
  text: {
    ...darkTheme.text,
    selectionBackgroundColor: '#42b883',
    selectionColor: '#ffffff',
  },
  textInput: {
    ...darkTheme.textInput,
    focusBorderColor: '#42b883',
  },
  numericInput: {
    ...darkTheme.numericInput,
    focusBorderColor: '#42b883',
  },
  titlebar: {
    ...darkTheme.titlebar,
    activeBackgroundColor: '#233d31',
    activeButtonFilledBackgroundColor: '#42b883',
    activeIconColor: '#42b883',
    activeMutedTextColor: 'rgba(66, 184, 131, 0.6)',
    activeTextColor: '#42b883',
    buttonHoverBackgroundColor: 'rgba(66, 184, 131, 0.12)',
    buttonPressedBackgroundColor: 'rgba(66, 184, 131, 0.18)',
    focusRing: '2px solid #42b883',
    selectionBackgroundColor: '#42b883',
  },
  titlebarMenu: {
    ...darkTheme.titlebarMenu,
    itemHoverBackgroundColor: 'rgba(66, 184, 131, 0.12)',
  },
  chatBox: {
    ...darkTheme.chatBox,
    buttonBackgroundColor: '#42b883',
    buttonColor: '#ffffff',
    buttonHoverBackgroundColor: '#369a6e',
    caretColor: '#42b883',
    selectionBackgroundColor: '#42b883',
    selectionColor: '#ffffff',
  },
};
