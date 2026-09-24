---
sidebar_label: Theming
title: "Theming | Kritzel for Vue"
description: "Reference for every property supported by the KritzelTheme interface."
toc_max_heading_level: 2
---

# Theming

This is the API reference for `KritzelTheme`. It lists the theme groups and their supported properties. All values are CSS strings. Override selected values by spreading an existing preset and replacing only the groups you need.

```ts
import { lightTheme, type KritzelTheme } from '@kritzel/vue-editor'

const customTheme: KritzelTheme = {
	...lightTheme,
	name: 'brand-theme',
	global: { ...lightTheme.global, textPrimary: '#172033' },
	engine: { ...lightTheme.engine, backgroundColor: 'transparent' },
	toolbar: { ...lightTheme.toolbar, controlSelectedBackgroundColor: '#0f766e' },
}
```

Use [Themes](../customization/themes.md) for Vue registration and binding examples.

## Global

`borderColor`, `dividerColor`, `focusColor`, `focusRingColor`, `iconColor`, `scrollbarThumbColor`, `textPrimary`, `textSecondary`.

## Back To Content

`activeBackgroundColor`, `backgroundColor`, `border`, `boxShadow`, `color`, `hoverBackgroundColor`.

## Checkerboard

`colorDark`, `colorLight`.

## Color Palette

`circleBorderColor`, `hoverBackgroundColor`, `selectedBackgroundColor`.

## Context Menu

`backgroundColor`, `border`, `boxShadow`, `dividerColor`, `itemActiveBackgroundColor`, `itemColor`, `itemDisabledColor`, `itemHoverBackgroundColor`.

## Current User Dialog

`emailColor`, `nameColor`.

## Dialog

`backdropColor`, `backgroundColor`, `border`, `boxShadow`, `closeButtonActiveBackground`, `closeButtonBackground`, `closeButtonColor`, `closeButtonHoverBackground`, `closeButtonHoverColor`, `fontFamily`, `footerBorder`, `headerBorder`, `titleColor`.

## Dropdown

`accentColor`, `background`, `borderColor`, `borderRadius`, `hoverBackgroundColor`, `hoverBorderColor`, `menuBorderRadius`, `selectedBackgroundColor`, `textColor`.

## Editor

`loadingOverlayBackground`, `loadingOverlayColor`, `loadingOverlaySpinnerActiveColor`, `loadingOverlaySpinnerColor`, `syncIndicatorBackground`, `syncIndicatorColor`, `syncIndicatorSpinnerColor`, `syncIndicatorSpinnerTrack`, `syncIndicatorZIndex`.

## Engine

`backgroundColor`.

## Font Size

`hoverBackgroundColor`, `selectedBackgroundColor`, `textColor`.

## Line Endings

`hoverBackgroundColor`, `labelColor`, `optionBackground`, `selectedBackgroundColor`.

## Login Dialog

`buttonActiveBackground`, `buttonBackground`, `buttonBorderColor`, `buttonHoverBackground`, `buttonHoverBorderColor`, `buttonTextColor`, `spinnerActiveColor`, `spinnerColor`, `subtitleColor`.

## Master Detail

`backButtonColor`, `backgroundColor`, `detailBackgroundColor`, `detailFocusOutline`, `menuBackgroundColor`, `menuBorderRight`, `menuItemActiveBackgroundColor`, `menuItemBackgroundColor`, `menuItemChevronColor`, `menuItemColor`, `menuItemDisabledColor`, `menuItemFocusOutline`, `menuItemHoverBackgroundColor`, `menuItemSelectedBackgroundColor`, `menuItemSelectedColor`, `menuItemSelectedHoverBackgroundColor`.

## Menu

`backgroundColor`, `border`, `boxShadow`, `itemButtonHoverBackgroundColor`, `itemChildOpenBackgroundColor`, `itemColor`, `itemEditingBackgroundColor`, `itemInputBorder`, `itemInputBorderColorOnSelected`, `itemInputCaretColor`, `itemInputCaretColorOnSelected`, `itemInputSelectionColor`, `itemInputSelectionColorOnSelected`, `itemInputSelectionTextColor`, `itemInputSelectionTextColorOnSelected`, `itemOverlayBackgroundColor`, `itemSelectedBackgroundColor`, `itemSelectedColor`.

## More Menu

`backgroundColor`, `border`, `borderRadius`, `boxShadow`, `buttonActiveBackgroundColor`, `buttonColor`, `buttonHoverBackgroundColor`, `innerBorderRadius`.

## Notification Card

`backgroundColor`, `border`, `borderRadius`, `boxShadow`, `color`, `dismissButtonActiveBackgroundColor`, `dismissButtonBackgroundColor`, `dismissButtonBorderRadius`, `dismissButtonColor`, `dismissButtonHoverBackgroundColor`, `dismissButtonSize`, `errorPillBackgroundColor`, `errorPillColor`, `headerGap`, `headerMarginBottom`, `headerRightGap`, `infoPillBackgroundColor`, `infoPillColor`, `maxWidth`, `messageColor`, `messageFontSize`, `messageLineHeight`, `padding`, `pillBackgroundColor`, `pillBorderRadius`, `pillColor`, `pillFontSize`, `pillFontWeight`, `pillHeight`, `pillPadding`, `timestampColor`, `timestampFontSize`, `warningPillBackgroundColor`, `warningPillColor`.

## Numeric Input

`borderColor`, `borderRadius`, `focusBorderColor`, `hoverBorderColor`, `inputBackground`, `labelColor`, `selectionBackground`, `selectionColor`, `spinnerActiveBackground`, `spinnerBackground`, `spinnerBorderRadius`, `spinnerColor`, `spinnerHoverBackground`, `textColor`.

## Opacity Slider

`activeColor`, `thumbBorderColor`, `thumbColor`, `trackColor`.

## Pill Tabs

`background`, `tabBackground`, `tabBackgroundHover`, `tabBackgroundSelected`, `tabLabelMaxWidth`, `tabShadowSelected`, `tabTextColor`, `tabTextColorSelected`.

## Selection

`borderColor`, `boxBackgroundColor`, `boxBorderColor`, `handleColor`, `handleStrokeColor`.

## Settings

`contentHeadingColor`, `contentTextColor`, `descriptionColor`, `labelColor`, `shortcutItemBg`, `shortcutKeyBg`, `shortcutKeyBorder`, `shortcutKeyColor`.

## Shape Fill

`hoverBackgroundColor`, `optionBackground`, `selectedBackgroundColor`.

## Share Dialog

`borderColor`, `copyButtonBackground`, `copyButtonColor`, `copyButtonHoverBackground`, `copyButtonHoverColor`, `copySuccessBackground`, `copySuccessColor`, `descriptionColor`, `inputBackground`, `inputBorderColor`, `inputTextColor`, `labelColor`, `revokeButtonBorderColor`, `revokeButtonColor`, `revokeButtonHoverBackground`, `revokeButtonHoverColor`, `selectionColor`.

## Slide Toggle

`thumbColor`, `thumbSize`, `trackCheckedColor`, `trackColor`, `transitionDuration`.

## Snap

`indicatorFill`, `indicatorFillInactive`, `indicatorStroke`, `indicatorStrokeInactive`, `lineStroke`.

## Split Button

`backgroundColor`, `border`, `boxShadow`, `color`, `dividerBackgroundColor`, `hoverBackgroundColor`.

## Stroke Size

`hoverBackgroundColor`, `selectedBackgroundColor`.

## Text Input

`background`, `borderColor`, `borderRadius`, `focusBorderColor`, `hoverBorderColor`, `labelColor`, `placeholderColor`, `selectionBackground`, `selectionColor`, `suffixBackground`, `suffixColor`, `textColor`.

## Toolbar

`backgroundColor`, `border`, `boxShadow`, `controlActiveBackgroundColor`, `controlColor`, `controlHoverBackgroundColor`, `controlSelectedBackgroundColor`, `controlSelectedColor`, `separatorColor`.

## Tooltip

`backgroundColor`, `border`, `boxShadow`, `color`.

## Utility Panel

`backgroundColor`, `buttonColor`, `buttonHoverBackgroundColor`, `separatorColor`.

## Watermark

`background`, `boxShadow`, `color`.

## Zoom Panel

`backgroundColor`, `border`, `borderRadius`, `boxShadow`, `buttonActiveBackgroundColor`, `buttonBorderRadius`, `buttonHoverBackgroundColor`, `buttonSize`, `gap`, `iconColor`, `padding`.