---
sidebar_label: Theming
title: "Theming | Kritzel for Angular"
description: "Reference for every property supported by the KritzelTheme interface."
toc_max_heading_level: 2
---

# Theming

`KritzelTheme` is the complete theme definition used to customize Kritzel. The `name`
property identifies the theme, and each optional group contains CSS custom property
overrides for one part of the editor. All values are strings so that colors, lengths,
font declarations, shadows, and CSS expressions can be supplied as needed.

```ts
import type { KritzelTheme } from 'kritzel-angular';

const customTheme: KritzelTheme = {
  name: 'custom',
  global: {
    primaryColor: '#0f766e',
    textPrimary: '#17211f',
  },
  engine: {
    backgroundColor: '#f7faf9',
  },
};
```

## Theme identity

| Property | Type |
|----------|------|
| `name` | `ThemeName` (`'light'`, `'dark'`, or a custom string) |

## Global

`global` contains values shared by the editor and its controls.

```ts
global?: {
  cursorTrailColor?: string;
  cursorTrailOpacity?: string;
  dividerColor?: string;
  focusColor?: string;
  fontFamily?: string;
  borderColor?: string;
  focusRingColor?: string;
  iconColor?: string;
  pointerCursor?: string;
  primaryColor?: string;
  primaryHoverColor?: string;
  primaryTextColor?: string;
  scrollbarThumbColor?: string;
  textPrimary?: string;
  textSecondary?: string;
  name?: string;
}
```

## Active users

```ts
activeUsers?: {
  avatarBorderColor?: string;
  overflowColor?: string;
  overflowFontSize?: string;
  tooltipBackground?: string;
  tooltipColor?: string;
}
```

## Avatar

```ts
avatar?: {
  border?: string;
  defaultBackground?: string;
  defaultColor?: string;
  initialsColor?: string;
  initialsFontFamily?: string;
  initialsFontWeight?: string;
}
```

## Awareness

```ts
awareness?: {
  cursorLabelFontSize?: string;
  cursorLabelTextColor?: string;
  cursorTransitionDuration?: string;
}
```

## Back to content

```ts
backToContent?: {
  activeBackgroundColor?: string;
  backgroundColor?: string;
  border?: string;
  borderRadius?: string;
  boxShadow?: string;
  color?: string;
  fontSize?: string;
  fontWeight?: string;
  gap?: string;
  height?: string;
  hoverBackgroundColor?: string;
  padding?: string;
  zIndex?: string;
}
```

## Button

```ts
button?: {
  borderRadius?: string;
  fontSize?: string;
  fontWeight?: string;
  padding?: string;
  primaryActiveBackgroundColor?: string;
  primaryBackgroundColor?: string;
  primaryColor?: string;
  primaryHoverBackgroundColor?: string;
  secondaryActiveBackgroundColor?: string;
  secondaryBackgroundColor?: string;
  secondaryColor?: string;
  secondaryHoverBackgroundColor?: string;
  textActiveBackgroundColor?: string;
  textColor?: string;
  textHoverBackgroundColor?: string;
  width?: string;
}
```

## Checkerboard

```ts
checkerboard?: {
  colorDark?: string;
  colorLight?: string;
}
```

## Color palette

```ts
colorPalette?: {
  circleBorderColor?: string;
  hoverBackgroundColor?: string;
  selectedBackgroundColor?: string;
}
```

## Context menu

```ts
contextMenu?: {
  backgroundColor?: string;
  border?: string;
  borderRadius?: string;
  boxShadow?: string;
  dividerColor?: string;
  dividerMargin?: string;
  itemActiveBackgroundColor?: string;
  itemBorderRadius?: string;
  itemColor?: string;
  itemDisabledColor?: string;
  itemFontSize?: string;
  itemGap?: string;
  itemHoverBackgroundColor?: string;
  itemPadding?: string;
  itemSpacing?: string;
  minWidth?: string;
  padding?: string;
}
```

## Current user dialog

```ts
currentUserDialog?: {
  emailColor?: string;
  logoutButtonActiveBackgroundColor?: string;
  logoutButtonBackgroundColor?: string;
  logoutButtonColor?: string;
  logoutButtonHoverBackgroundColor?: string;
  nameColor?: string;
}
```

## Dialog

```ts
dialog?: {
  backdropColor?: string;
  backgroundColor?: string;
  bodyPadding?: string;
  border?: string;
  borderRadius?: string;
  boxShadow?: string;
  closeButtonActiveBackground?: string;
  closeButtonBackground?: string;
  closeButtonBorderRadius?: string;
  closeButtonColor?: string;
  closeButtonHoverBackground?: string;
  closeButtonHoverColor?: string;
  fontFamily?: string;
  footerBorder?: string;
  footerGap?: string;
  footerPadding?: string;
  headerBorder?: string;
  headerPadding?: string;
  heightLarge?: string;
  heightMedium?: string;
  heightSmall?: string;
  maxHeight?: string;
  maxWidth?: string;
  titleColor?: string;
  titleFontSize?: string;
  titleFontWeight?: string;
  widthLarge?: string;
  widthMedium?: string;
  widthSmall?: string;
}
```

## Dropdown

```ts
dropdown?: {
  accentColor?: string;
  background?: string;
  borderColor?: string;
  borderRadius?: string;
  hoverBackgroundColor?: string;
  hoverBorderColor?: string;
  menuBorderRadius?: string;
  selectedBackgroundColor?: string;
  textColor?: string;
  triggerFontSize?: string;
  triggerPadding?: string;
}
```

## Editor

```ts
editor?: {
  loadingOverlayBackground?: string;
  loadingOverlayColor?: string;
  loadingOverlayDelay?: string;
  loadingOverlaySpinnerActiveColor?: string;
  loadingOverlaySpinnerColor?: string;
  loadingOverlayZIndex?: string;
  notificationAnimationDuration?: string;
  notificationAnimationEasing?: string;
  notificationDismissAnimationDuration?: string;
  notificationDismissAnimationEasing?: string;
  syncIndicatorBackground?: string;
  syncIndicatorColor?: string;
  syncIndicatorSpinnerColor?: string;
  syncIndicatorSpinnerTrack?: string;
  syncIndicatorZIndex?: string;
  toolbarBottom?: string;
  toolbarTransform?: string;
  toolbarTransition?: string;
  toolbarTransitionDuration?: string;
  topCenterNotificationTop?: string;
  topCenterNotificationZIndex?: string;
  topLeftButtonsLeft?: string;
  topLeftButtonsTop?: string;
  topRightButtonsRight?: string;
  topRightButtonsTop?: string;
}
```

## Engine

```ts
engine?: {
  backgroundColor?: string;
}
```

## Font size

```ts
fontSize?: {
  hoverBackgroundColor?: string;
  selectedBackgroundColor?: string;
  textColor?: string;
}
```

## Line endings

```ts
lineEndings?: {
  hoverBackgroundColor?: string;
  labelColor?: string;
  optionBackground?: string;
  selectedBackgroundColor?: string;
}
```

## Login dialog

```ts
loginDialog?: {
  buttonActiveBackground?: string;
  buttonBackground?: string;
  buttonBorderColor?: string;
  buttonHoverBackground?: string;
  buttonHoverBorderColor?: string;
  buttonTextColor?: string;
  spinnerActiveColor?: string;
  spinnerColor?: string;
  subtitleColor?: string;
}
```

## Master detail

```ts
masterDetail?: {
  backButtonColor?: string;
  backgroundColor?: string;
  detailBackgroundColor?: string;
  detailFocusOutline?: string;
  detailFocusOutlineOffset?: string;
  detailPadding?: string;
  gap?: string;
  menuBackgroundColor?: string;
  menuBorderRight?: string;
  menuGap?: string;
  menuItemActiveBackgroundColor?: string;
  menuItemBackgroundColor?: string;
  menuItemBorderRadius?: string;
  menuItemChevronColor?: string;
  menuItemColor?: string;
  menuItemDisabledColor?: string;
  menuItemFocusOutline?: string;
  menuItemFocusOutlineOffset?: string;
  menuItemFontSize?: string;
  menuItemFontWeight?: string;
  menuItemGap?: string;
  menuItemHoverBackgroundColor?: string;
  menuItemPadding?: string;
  menuItemSelectedBackgroundColor?: string;
  menuItemSelectedColor?: string;
  menuItemSelectedFontWeight?: string;
  menuItemSelectedHoverBackgroundColor?: string;
  menuMinWidth?: string;
  menuPadding?: string;
  menuWidth?: string;
  minHeight?: string;
}
```

## Menu

```ts
menu?: {
  backgroundColor?: string;
  border?: string;
  borderRadius?: string;
  boxShadow?: string;
  gap?: string;
  itemBorderRadius?: string;
  itemButtonHoverBackgroundColor?: string;
  itemChildOpenBackgroundColor?: string;
  itemColor?: string;
  itemEditingBackgroundColor?: string;
  itemFontSize?: string;
  itemHeight?: string;
  itemInputBorder?: string;
  itemInputBorderColorOnSelected?: string;
  itemInputCaretColor?: string;
  itemInputCaretColorOnSelected?: string;
  itemInputHeight?: string;
  itemInputSelectionColor?: string;
  itemInputSelectionColorOnSelected?: string;
  itemInputSelectionTextColor?: string;
  itemInputSelectionTextColorOnSelected?: string;
  itemMinHeight?: string;
  itemOverlayBackgroundColor?: string;
  itemPadding?: string;
  itemSelectedBackgroundColor?: string;
  itemSelectedColor?: string;
  padding?: string;
  width?: string;
}
```

## More menu

```ts
moreMenu?: {
  backgroundColor?: string;
  border?: string;
  borderRadius?: string;
  boxShadow?: string;
  buttonActiveBackgroundColor?: string;
  buttonColor?: string;
  buttonHeight?: string;
  buttonHoverBackgroundColor?: string;
  buttonWidth?: string;
  innerBorderRadius?: string;
  padding?: string;
}
```

## Notification card

```ts
notificationCard?: {
  backgroundColor?: string;
  border?: string;
  borderRadius?: string;
  boxShadow?: string;
  color?: string;
  dismissButtonActiveBackgroundColor?: string;
  dismissButtonBackgroundColor?: string;
  dismissButtonBorderRadius?: string;
  dismissButtonColor?: string;
  dismissButtonHoverBackgroundColor?: string;
  dismissButtonSize?: string;
  errorPillBackgroundColor?: string;
  errorPillColor?: string;
  headerGap?: string;
  headerMarginBottom?: string;
  headerRightGap?: string;
  infoPillBackgroundColor?: string;
  infoPillColor?: string;
  maxWidth?: string;
  messageColor?: string;
  messageFontSize?: string;
  messageLineHeight?: string;
  padding?: string;
  pillBackgroundColor?: string;
  pillBorderRadius?: string;
  pillColor?: string;
  pillFontSize?: string;
  pillFontWeight?: string;
  pillHeight?: string;
  pillPadding?: string;
  timestampColor?: string;
  timestampFontSize?: string;
  warningPillBackgroundColor?: string;
  warningPillColor?: string;
}
```

## Numeric input

```ts
numericInput?: {
  borderColor?: string;
  borderRadius?: string;
  focusBorderColor?: string;
  hoverBorderColor?: string;
  inputBackground?: string;
  labelColor?: string;
  selectionBackground?: string;
  selectionColor?: string;
  spinnerActiveBackground?: string;
  spinnerBackground?: string;
  spinnerBorderRadius?: string;
  spinnerColor?: string;
  spinnerHoverBackground?: string;
  textColor?: string;
}
```

## Opacity slider

```ts
opacitySlider?: {
  activeColor?: string;
  thumbBorderColor?: string;
  thumbColor?: string;
  trackColor?: string;
}
```

## Pill tabs

```ts
pillTabs?: {
  background?: string;
  borderRadius?: string;
  tabBackground?: string;
  tabBackgroundHover?: string;
  tabBackgroundSelected?: string;
  tabBorderRadius?: string;
  tabLabelMaxWidth?: string;
  tabShadowSelected?: string;
  tabTextColor?: string;
  tabTextColorSelected?: string;
}
```

## Portal

```ts
portal?: {
  maxHeight?: string;
}
```

## Selection

```ts
selection?: {
  borderColor?: string;
  borderWidth?: string;
  boxBackgroundColor?: string;
  boxBorderColor?: string;
  handleColor?: string;
  handleSize?: string;
  handleStrokeColor?: string;
}
```

## Settings

```ts
settings?: {
  contentHeadingColor?: string;
  contentTextColor?: string;
  descriptionColor?: string;
  labelColor?: string;
  shortcutItemBg?: string;
  shortcutKeyBg?: string;
  shortcutKeyBorder?: string;
  shortcutKeyColor?: string;
}
```

## Shape fill

```ts
shapeFill?: {
  hoverBackgroundColor?: string;
  optionBackground?: string;
  selectedBackgroundColor?: string;
}
```

## Share dialog

```ts
shareDialog?: {
  borderColor?: string;
  copyButtonBackground?: string;
  copyButtonColor?: string;
  copyButtonHoverBackground?: string;
  copyButtonHoverColor?: string;
  copySuccessBackground?: string;
  copySuccessColor?: string;
  descriptionColor?: string;
  inputBackground?: string;
  inputBorderColor?: string;
  inputTextColor?: string;
  labelColor?: string;
  qrBackground?: string;
  qrBorderColor?: string;
  revokeButtonBorderColor?: string;
  revokeButtonColor?: string;
  revokeButtonHoverBackground?: string;
  revokeButtonHoverColor?: string;
  selectionColor?: string;
}
```

## Slide toggle

```ts
slideToggle?: {
  borderRadius?: string;
  height?: string;
  thumbColor?: string;
  thumbSize?: string;
  trackCheckedColor?: string;
  trackColor?: string;
  transitionDuration?: string;
  width?: string;
}
```

## Snap

```ts
snap?: {
  indicatorFill?: string;
  indicatorFillInactive?: string;
  indicatorStroke?: string;
  indicatorStrokeInactive?: string;
  lineStroke?: string;
}
```

## Split button

```ts
splitButton?: {
  backgroundColor?: string;
  border?: string;
  borderRadius?: string;
  boxShadow?: string;
  color?: string;
  dividerBackgroundColor?: string;
  dividerWidth?: string;
  fontSize?: string;
  gap?: string;
  hoverBackgroundColor?: string;
  padding?: string;
}
```

## Stroke size

```ts
strokeSize?: {
  hoverBackgroundColor?: string;
  selectedBackgroundColor?: string;
}
```

## Submenu

```ts
submenu?: {
  gap?: string;
}
```

## Text input

```ts
textInput?: {
  background?: string;
  borderColor?: string;
  borderRadius?: string;
  focusBorderColor?: string;
  hoverBorderColor?: string;
  labelColor?: string;
  placeholderColor?: string;
  selectionBackground?: string;
  selectionColor?: string;
  suffixBackground?: string;
  suffixColor?: string;
  textColor?: string;
}
```

## Toolbar

```ts
toolbar?: {
  backgroundColor?: string;
  border?: string;
  borderRadius?: string;
  boxShadow?: string;
  controlActiveBackgroundColor?: string;
  controlBorderRadius?: string;
  controlColor?: string;
  controlHoverBackgroundColor?: string;
  controlPadding?: string;
  controlSelectedBackgroundColor?: string;
  controlSelectedColor?: string;
  gap?: string;
  padding?: string;
  separatorColor?: string;
}
```

## Tooltip

```ts
tooltip?: {
  backgroundColor?: string;
  border?: string;
  borderRadius?: string;
  boxShadow?: string;
  color?: string;
  padding?: string;
}
```

## Utility panel

```ts
utilityPanel?: {
  backgroundColor?: string;
  buttonBorderRadius?: string;
  buttonColor?: string;
  buttonHoverBackgroundColor?: string;
  separatorColor?: string;
}
```

## Watermark

```ts
watermark?: {
  background?: string;
  borderRadius?: string;
  boxShadow?: string;
  color?: string;
  fontSize?: string;
  offsetBottom?: string;
  offsetRight?: string;
  opacity?: string;
}
```

## Zoom panel

```ts
zoomPanel?: {
  backgroundColor?: string;
  border?: string;
  borderRadius?: string;
  boxShadow?: string;
  buttonActiveBackgroundColor?: string;
  buttonBorderRadius?: string;
  buttonHoverBackgroundColor?: string;
  buttonSize?: string;
  gap?: string;
  iconColor?: string;
  padding?: string;
}
```

The interface is generated from Kritzel's theme variables. When new theme variables are
introduced in the library, regenerate `theme.interface.ts` and update this reference.