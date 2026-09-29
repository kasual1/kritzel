import { darkTheme, KritzelTheme } from "@kritzel/react-editor";

export const reactThemeDark: KritzelTheme = {
  ...darkTheme,
  name: "dark",
  global: {
    ...darkTheme.global,
    primaryColor: "#2f8be0",
    primaryHoverColor: "#1c72c4",
    primaryTextColor: "#ffffff",
    focusRingColor: "rgba(47, 139, 224, 0.3)",
  },
  button: {
    ...darkTheme.button,
    primaryBackgroundColor: "#2f8be0",
    primaryHoverBackgroundColor: "#1c72c4",
    primaryActiveBackgroundColor: "#0959a4",
    primaryColor: "#ffffff",
  },
  currentUserDialog: {
    ...darkTheme.currentUserDialog,
    logoutButtonBackgroundColor: "#2f8be0",
    logoutButtonHoverBackgroundColor: "#1c72c4",
    logoutButtonActiveBackgroundColor: "#0959a4",
    logoutButtonColor: "#ffffff",
  },
  selection: {
    ...darkTheme.selection,
    borderColor: "#2f8be0",
    boxBackgroundColor: "rgba(47, 139, 224, 0.15)",
    boxBorderColor: "rgba(47, 139, 224, 0.4)",
    handleStrokeColor: "#2f8be0",
  },
  toolbar: {
    ...darkTheme.toolbar,
    controlHoverBackgroundColor: "rgba(47, 139, 224, 0.12)",
    controlActiveBackgroundColor: "rgba(47, 139, 224, 0.18)",
    controlSelectedBackgroundColor: "#2f8be0",
  },
  contextMenu: {
    ...darkTheme.contextMenu,
    itemHoverBackgroundColor: "rgba(47, 139, 224, 0.12)",
    itemActiveBackgroundColor: "rgba(47, 139, 224, 0.18)",
  },
  menu: {
    ...darkTheme.menu,
    itemButtonHoverBackgroundColor: "rgba(47, 139, 224, 0.12)",
    itemOverlayBackgroundColor: "rgba(47, 139, 224, 0.12)",
    itemSelectedBackgroundColor: "#2f8be0",
    itemInputSelectionColor: "#2f8be0",
  },
  snap: {
    ...darkTheme.snap,
    indicatorStroke: "#2f8be0",
    indicatorStrokeInactive: "rgba(255, 255, 255, 0.45)",
    indicatorFill: "rgba(47, 139, 224, 0.35)",
    indicatorFillInactive: "rgba(47, 139, 224, 0.2)",
    lineStroke: "rgba(47, 139, 224, 0.28)",
  },
  splitButton: {
    ...darkTheme.splitButton,
    hoverBackgroundColor: "rgba(47, 139, 224, 0.12)",
  },
  dropdown: {
    ...darkTheme.dropdown,
    accentColor: "#2f8be0",
    selectedBackgroundColor: "rgba(47, 139, 224, 0.15)",
  },
  slideToggle: {
    ...darkTheme.slideToggle,
    trackCheckedColor: "#2f8be0",
  },
  loginDialog: {
    ...darkTheme.loginDialog,
    buttonHoverBackground: "rgba(47, 139, 224, 0.12)",
  },
  opacitySlider: {
    ...darkTheme.opacitySlider,
    activeColor: "#2f8be0",
    thumbBorderColor: "#2f8be0",
  },
  moreMenu: {
    ...darkTheme.moreMenu,
    buttonHoverBackgroundColor: "rgba(47, 139, 224, 0.12)",
    buttonActiveBackgroundColor: "rgba(47, 139, 224, 0.18)",
  },
  masterDetail: {
    ...darkTheme.masterDetail,
    menuItemHoverBackgroundColor: "rgba(47, 139, 224, 0.12)",
    menuItemActiveBackgroundColor: "rgba(47, 139, 224, 0.18)",
    menuItemSelectedBackgroundColor: "#2f8be0",
    menuItemSelectedHoverBackgroundColor: "#2f8be0",
    menuItemSelectedColor: "#ffffff",
  },
  textInput: {
    ...darkTheme.textInput,
    focusBorderColor: "#2f8be0",
  },
  numericInput: {
    ...darkTheme.numericInput,
    focusBorderColor: "#2f8be0",
  },
};
