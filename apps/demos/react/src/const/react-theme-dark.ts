import { darkTheme, KritzelTheme } from "@kritzel/react-editor";

export const reactThemeDark: KritzelTheme = {
  ...darkTheme,
  name: "dark",
  global: {
    ...darkTheme.global,
    primaryColor: "#5B8CFF",
    primaryHoverColor: "#4D77D9",
    primaryTextColor: "#ffffff",
    focusRingColor: "rgba(91, 140, 255, 0.3)",
  },
  button: {
    ...darkTheme.button,
    primaryBackgroundColor: "#5B8CFF",
    primaryHoverBackgroundColor: "#4D77D9",
    primaryActiveBackgroundColor: "#3F62B3",
    primaryColor: "#ffffff",
  },
  currentUserDialog: {
    ...darkTheme.currentUserDialog,
    logoutButtonBackgroundColor: "#5B8CFF",
    logoutButtonHoverBackgroundColor: "#4D77D9",
    logoutButtonActiveBackgroundColor: "#3F62B3",
    logoutButtonColor: "#ffffff",
  },
  selection: {
    ...darkTheme.selection,
    borderColor: "#5B8CFF",
    boxBackgroundColor: "rgba(91, 140, 255, 0.15)",
    boxBorderColor: "rgba(91, 140, 255, 0.4)",
    handleStrokeColor: "#5B8CFF",
  },
  toolbar: {
    ...darkTheme.toolbar,
    controlHoverBackgroundColor: "rgba(91, 140, 255, 0.12)",
    controlActiveBackgroundColor: "rgba(91, 140, 255, 0.18)",
    controlSelectedBackgroundColor: "#5B8CFF",
  },
  contextMenu: {
    ...darkTheme.contextMenu,
    itemHoverBackgroundColor: "rgba(91, 140, 255, 0.12)",
    itemActiveBackgroundColor: "rgba(91, 140, 255, 0.18)",
  },
  menu: {
    ...darkTheme.menu,
    itemButtonHoverBackgroundColor: "rgba(91, 140, 255, 0.12)",
    itemOverlayBackgroundColor: "rgba(91, 140, 255, 0.12)",
    itemSelectedBackgroundColor: "#5B8CFF",
    itemInputSelectionColor: "#5B8CFF",
  },
  snap: {
    ...darkTheme.snap,
    indicatorStroke: "#5B8CFF",
    indicatorStrokeInactive: "rgba(255, 255, 255, 0.45)",
    indicatorFill: "rgba(91, 140, 255, 0.35)",
    indicatorFillInactive: "rgba(91, 140, 255, 0.2)",
    lineStroke: "rgba(91, 140, 255, 0.28)",
  },
  splitButton: {
    ...darkTheme.splitButton,
    hoverBackgroundColor: "rgba(91, 140, 255, 0.12)",
  },
  dropdown: {
    ...darkTheme.dropdown,
    accentColor: "#5B8CFF",
    selectedBackgroundColor: "rgba(91, 140, 255, 0.15)",
  },
  slideToggle: {
    ...darkTheme.slideToggle,
    trackCheckedColor: "#5B8CFF",
  },
  loginDialog: {
    ...darkTheme.loginDialog,
    buttonHoverBackground: "rgba(91, 140, 255, 0.12)",
  },
  opacitySlider: {
    ...darkTheme.opacitySlider,
    activeColor: "#5B8CFF",
    thumbBorderColor: "#5B8CFF",
  },
  moreMenu: {
    ...darkTheme.moreMenu,
    buttonHoverBackgroundColor: "rgba(91, 140, 255, 0.12)",
    buttonActiveBackgroundColor: "rgba(91, 140, 255, 0.18)",
  },
  masterDetail: {
    ...darkTheme.masterDetail,
    menuItemHoverBackgroundColor: "rgba(91, 140, 255, 0.12)",
    menuItemActiveBackgroundColor: "rgba(91, 140, 255, 0.18)",
    menuItemSelectedBackgroundColor: "#5B8CFF",
    menuItemSelectedHoverBackgroundColor: "#5B8CFF",
    menuItemSelectedColor: "#ffffff",
  },
  text: {
    ...darkTheme.text,
    selectionBackgroundColor: "#5B8CFF",
    selectionColor: "#ffffff",
  },
  textInput: {
    ...darkTheme.textInput,
    focusBorderColor: "#5B8CFF",
  },
  numericInput: {
    ...darkTheme.numericInput,
    focusBorderColor: "#5B8CFF",
  },
  titlebar: {
    ...darkTheme.titlebar,
    activeBackgroundColor: "#28334c",
    activeButtonFilledBackgroundColor: "#5B8CFF",
    activeIconColor: "#5B8CFF",
    activeMutedTextColor: "rgba(91, 140, 255, 0.6)",
    activeTextColor: "#5B8CFF",
    buttonHoverBackgroundColor: "rgba(91, 140, 255, 0.12)",
    buttonPressedBackgroundColor: "rgba(91, 140, 255, 0.18)",
    focusRing: "2px solid #5B8CFF",
    selectionBackgroundColor: "#5B8CFF",
  },
  titlebarMenu: {
    ...darkTheme.titlebarMenu,
    itemHoverBackgroundColor: "rgba(91, 140, 255, 0.12)",
  },
};
