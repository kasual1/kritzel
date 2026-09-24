import { darkTheme, KritzelTheme } from "@kritzel/react-editor";

export const reactThemeDark: KritzelTheme = {
  ...darkTheme,
  name: "dark",
  global: {
    ...darkTheme.global,
    primaryColor: "#149eca",
    primaryHoverColor: "#087ea4",
    primaryTextColor: "#ffffff",
    focusRingColor: "rgba(20, 158, 202, 0.3)",
  },
  button: {
    ...darkTheme.button,
    primaryBackgroundColor: "#149eca",
    primaryHoverBackgroundColor: "#087ea4",
    primaryActiveBackgroundColor: "#065d7a",
    primaryColor: "#ffffff",
  },
  currentUserDialog: {
    ...darkTheme.currentUserDialog,
    logoutButtonBackgroundColor: "#149eca",
    logoutButtonHoverBackgroundColor: "#087ea4",
    logoutButtonActiveBackgroundColor: "#065d7a",
    logoutButtonColor: "#ffffff",
  },
  selection: {
    ...darkTheme.selection,
    borderColor: "#149eca",
    boxBackgroundColor: "rgba(20, 158, 202, 0.15)",
    boxBorderColor: "rgba(20, 158, 202, 0.4)",
    handleStrokeColor: "#149eca",
  },
  toolbar: {
    ...darkTheme.toolbar,
    controlHoverBackgroundColor: "rgba(20, 158, 202, 0.12)",
    controlActiveBackgroundColor: "rgba(20, 158, 202, 0.18)",
    controlSelectedBackgroundColor: "#149eca",
  },
  contextMenu: {
    ...darkTheme.contextMenu,
    itemHoverBackgroundColor: "rgba(20, 158, 202, 0.12)",
    itemActiveBackgroundColor: "rgba(20, 158, 202, 0.18)",
  },
  menu: {
    ...darkTheme.menu,
    itemButtonHoverBackgroundColor: "rgba(20, 158, 202, 0.12)",
    itemOverlayBackgroundColor: "rgba(20, 158, 202, 0.12)",
    itemSelectedBackgroundColor: "#149eca",
    itemInputSelectionColor: "#149eca",
  },
  snap: {
    ...darkTheme.snap,
    indicatorStroke: "#149eca",
    indicatorStrokeInactive: "rgba(255, 255, 255, 0.45)",
    indicatorFill: "rgba(20, 158, 202, 0.35)",
    indicatorFillInactive: "rgba(20, 158, 202, 0.2)",
    lineStroke: "rgba(20, 158, 202, 0.28)",
  },
  splitButton: {
    ...darkTheme.splitButton,
    hoverBackgroundColor: "rgba(20, 158, 202, 0.12)",
  },
  dropdown: {
    ...darkTheme.dropdown,
    accentColor: "#149eca",
    selectedBackgroundColor: "rgba(20, 158, 202, 0.15)",
  },
  slideToggle: {
    ...darkTheme.slideToggle,
    trackCheckedColor: "#149eca",
  },
  loginDialog: {
    ...darkTheme.loginDialog,
    buttonHoverBackground: "rgba(20, 158, 202, 0.12)",
  },
  opacitySlider: {
    ...darkTheme.opacitySlider,
    activeColor: "#149eca",
    thumbBorderColor: "#149eca",
  },
  moreMenu: {
    ...darkTheme.moreMenu,
    buttonHoverBackgroundColor: "rgba(20, 158, 202, 0.12)",
    buttonActiveBackgroundColor: "rgba(20, 158, 202, 0.18)",
  },
  masterDetail: {
    ...darkTheme.masterDetail,
    menuItemHoverBackgroundColor: "rgba(20, 158, 202, 0.12)",
    menuItemActiveBackgroundColor: "rgba(20, 158, 202, 0.18)",
    menuItemSelectedBackgroundColor: "#149eca",
    menuItemSelectedHoverBackgroundColor: "#149eca",
    menuItemSelectedColor: "#ffffff",
  },
  textInput: {
    ...darkTheme.textInput,
    focusBorderColor: "#149eca",
  },
  numericInput: {
    ...darkTheme.numericInput,
    focusBorderColor: "#149eca",
  },
};
