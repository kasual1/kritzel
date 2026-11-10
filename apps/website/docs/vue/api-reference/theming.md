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

| Property | Light default | Dark default |
|----------|---------------|--------------|
| accentColor | #4A7DFF | #5B8CFF |
| selectedBackgroundColor | #4A7DFF1A | rgba(91, 140, 255, 0.2) |

## Editor

`syncIndicatorBackground`, `syncIndicatorColor`, `syncIndicatorSpinnerColor`, `syncIndicatorSpinnerTrack`, `syncIndicatorZIndex`.

| Property | Light default | Dark default |
|----------|---------------|--------------|
| syncIndicatorSpinnerColor | #4A7DFF | #5B8CFF |

## Element Highlight

Applies to the highlights and the picking highlight drawn inside the pages of iframe objects, see [Interacting with iFrame Content](../advanced/dynamic-objects.md#interacting-with-iframe-content). The values are applied as the CSS variables `--kritzel-element-highlight-color`, `--kritzel-element-highlight-background-color`, and `--kritzel-element-highlight-label-text-color`. A custom highlight or picking `color` is filled with a light tint of that color instead of `backgroundColor`.

`backgroundColor`, `color`, `labelTextColor`.

| Property | Light default | Dark default |
|----------|---------------|--------------|
| backgroundColor | rgba(0, 122, 255, 0.12) | rgba(10, 132, 255, 0.18) |
| color | #007AFF | #0A84FF |
| labelTextColor | #ffffff | #ffffff |

## Engine

`backgroundColor`.

## Font Size

`hoverBackgroundColor`, `selectedBackgroundColor`, `textColor`.

## Line Endings

`hoverBackgroundColor`, `labelColor`, `optionBackground`, `selectedBackgroundColor`.

## Loading Placeholder

Applies to the placeholder the engine draws over an object while its [`isLoading`](./objects.md#loading-state) is `true`: a grey surface with rounded corners and a glare that sweeps across it. The values are applied as the CSS variables `--kritzel-loading-placeholder-background-color`, `--kritzel-loading-placeholder-border-radius`, `--kritzel-loading-placeholder-glare-color`, and `--kritzel-loading-placeholder-animation-duration`. The glare stops when the user prefers reduced motion.

`animationDuration`, `backgroundColor`, `borderRadius`, `glareColor`.

| Property | Light default | Dark default |
|----------|---------------|--------------|
| animationDuration | 1.6s | 1.6s |
| backgroundColor | #e5e7eb | #2a2a2a |
| borderRadius | 12px | 12px |
| glareColor | rgba(255, 255, 255, 0.6) | rgba(255, 255, 255, 0.06) |

## Login Dialog

`buttonActiveBackground`, `buttonBackground`, `buttonBorderColor`, `buttonHoverBackground`, `buttonHoverBorderColor`, `buttonTextColor`, `spinnerActiveColor`, `spinnerColor`, `subtitleColor`.

## Master Detail

`backButtonColor`, `backgroundColor`, `detailBackgroundColor`, `detailFocusOutline`, `menuBackgroundColor`, `menuBorderRight`, `menuItemActiveBackgroundColor`, `menuItemBackgroundColor`, `menuItemChevronColor`, `menuItemColor`, `menuItemDisabledColor`, `menuItemFocusOutline`, `menuItemHoverBackgroundColor`, `menuItemSelectedBackgroundColor`, `menuItemSelectedColor`, `menuItemSelectedHoverBackgroundColor`.

| Property | Light default | Dark default |
|----------|---------------|--------------|
| menuItemSelectedBackgroundColor | #4A7DFF | #5B8CFF |
| menuItemSelectedHoverBackgroundColor | #4A7DFF | #5B8CFF |

## Menu

`backgroundColor`, `border`, `boxShadow`, `itemButtonHoverBackgroundColor`, `itemChildOpenBackgroundColor`, `itemColor`, `itemEditingBackgroundColor`, `itemInputBorder`, `itemInputBorderColorOnSelected`, `itemInputCaretColor`, `itemInputCaretColorOnSelected`, `itemInputSelectionColor`, `itemInputSelectionColorOnSelected`, `itemInputSelectionTextColor`, `itemInputSelectionTextColorOnSelected`, `itemOverlayBackgroundColor`, `itemSelectedBackgroundColor`, `itemSelectedColor`.

| Property | Light default | Dark default |
|----------|---------------|--------------|
| itemInputSelectionColor | #4A7DFF | #b0b0b0 |
| itemSelectedBackgroundColor | #4A7DFF | #5B8CFF |

## More Menu

`backgroundColor`, `border`, `borderRadius`, `boxShadow`, `buttonActiveBackgroundColor`, `buttonColor`, `buttonHoverBackgroundColor`, `innerBorderRadius`.

## Notification Card

`backgroundColor`, `border`, `borderRadius`, `boxShadow`, `color`, `dismissButtonActiveBackgroundColor`, `dismissButtonBackgroundColor`, `dismissButtonBorderRadius`, `dismissButtonColor`, `dismissButtonHoverBackgroundColor`, `dismissButtonSize`, `errorPillBackgroundColor`, `errorPillColor`, `headerGap`, `headerMarginBottom`, `headerRightGap`, `infoPillBackgroundColor`, `infoPillColor`, `maxWidth`, `messageColor`, `messageFontSize`, `messageLineHeight`, `padding`, `pillBackgroundColor`, `pillBorderRadius`, `pillColor`, `pillFontSize`, `pillFontWeight`, `pillHeight`, `pillPadding`, `timestampColor`, `timestampFontSize`, `warningPillBackgroundColor`, `warningPillColor`.

## Numeric Input

`borderColor`, `borderRadius`, `focusBorderColor`, `hoverBorderColor`, `inputBackground`, `labelColor`, `selectionBackground`, `selectionColor`, `spinnerActiveBackground`, `spinnerBackground`, `spinnerBorderRadius`, `spinnerColor`, `spinnerHoverBackground`, `textColor`.

| Property | Light default | Dark default |
|----------|---------------|--------------|
| selectionBackground | #4A7DFF | #5B8CFF |

## Opacity Slider

`activeColor`, `thumbBorderColor`, `thumbColor`, `trackColor`.

| Property | Light default | Dark default |
|----------|---------------|--------------|
| activeColor | #4A7DFF | #5B8CFF |
| thumbBorderColor | #4A7DFF | #5B8CFF |

## Pill Tabs

`background`, `tabBackground`, `tabBackgroundHover`, `tabBackgroundSelected`, `tabLabelMaxWidth`, `tabShadowSelected`, `tabTextColor`, `tabTextColorSelected`.

## Selection

`borderColor`, `boxBackgroundColor`, `boxBorderColor`, `handleColor`, `handleStrokeColor`.

| Property | Light default | Dark default |
|----------|---------------|--------------|
| borderColor | #4A7DFF | #5B8CFF |
| boxBackgroundColor | rgba(74, 125, 255, 0.2) | rgba(91, 140, 255, 0.2) |
| boxBorderColor | rgba(74, 125, 255, 0.5) | rgba(91, 140, 255, 0.5) |
| handleStrokeColor | #4A7DFF | #5B8CFF |

## Settings

`contentHeadingColor`, `contentTextColor`, `descriptionColor`, `labelColor`, `shortcutItemBg`, `shortcutKeyBg`, `shortcutKeyBorder`, `shortcutKeyColor`.

## Shape Fill

`hoverBackgroundColor`, `optionBackground`, `selectedBackgroundColor`.

## Share Dialog

`borderColor`, `copyButtonBackground`, `copyButtonColor`, `copyButtonHoverBackground`, `copyButtonHoverColor`, `copySuccessBackground`, `copySuccessColor`, `descriptionColor`, `inputBackground`, `inputBorderColor`, `inputTextColor`, `labelColor`, `revokeButtonBorderColor`, `revokeButtonColor`, `revokeButtonHoverBackground`, `revokeButtonHoverColor`, `selectionColor`.

| Property | Light default | Dark default |
|----------|---------------|--------------|
| selectionColor | #cce5ff | #5B8CFF |

## Slide Toggle

`thumbColor`, `thumbSize`, `trackCheckedColor`, `trackColor`, `transitionDuration`.

| Property | Light default | Dark default |
|----------|---------------|--------------|
| trackCheckedColor | #4A7DFF | #5B8CFF |

## Snap

`indicatorFill`, `indicatorFillInactive`, `indicatorStroke`, `indicatorStrokeInactive`, `lineStroke`.

| Property | Light default | Dark default |
|----------|---------------|--------------|
| indicatorFill | rgba(74, 125, 255, 0.3) | rgba(91, 140, 255, 0.35) |
| indicatorFillInactive | rgba(74, 125, 255, 0.18) | rgba(91, 140, 255, 0.2) |
| indicatorStroke | #4A7DFF | #5B8CFF |
| indicatorStrokeInactive | rgba(74, 125, 255, 0.5) | rgba(255, 255, 255, 0.45) |

## Split Button

`backgroundColor`, `border`, `boxShadow`, `color`, `dividerBackgroundColor`, `hoverBackgroundColor`.

## Stroke Size

`hoverBackgroundColor`, `selectedBackgroundColor`.

## Text Input

`background`, `borderColor`, `borderRadius`, `focusBorderColor`, `hoverBorderColor`, `labelColor`, `placeholderColor`, `selectionBackground`, `selectionColor`, `suffixBackground`, `suffixColor`, `textColor`.

| Property | Light default | Dark default |
|----------|---------------|--------------|
| selectionBackground | #4A7DFF | #5B8CFF |

## Titlebar

Applies to [object titlebars](../fundamentals/controls.md#object-titlebar). `height` and `offset` must be pixel values.

`activeBackgroundColor`, `activeBorder`, `activeBoxShadow`, `activeButtonFilledBackgroundColor`, `activeIconColor`, `activeMutedTextColor`, `activeTextColor`, `backgroundColor`, `border`, `borderRadius`, `boxShadow`, `buttonBorderRadius`, `buttonFilledBackgroundColor`, `buttonFilledColor`, `buttonHoverBackgroundColor`, `buttonOutlineColor`, `buttonPressedBackgroundColor`, `buttonSize`, `focusRing`, `fontFamily`, `fontSize`, `fontWeight`, `gap`, `height`, `hoverBackgroundColor`, `iconColor`, `iconSize`, `inputBackgroundColor`, `inputPadding`, `mutedTextColor`, `offset`, `paddingX`, `selectionBackgroundColor`, `selectionColor`, `textColor`, `titleFontWeight`, `transition`.

## Titlebar Menu

Applies to the menu that the editor opens from a titlebar `menu` element, see [Object Titlebar](../fundamentals/controls.md#object-titlebar). The defaults match the context menu.

`backgroundColor`, `border`, `borderRadius`, `boxShadow`, `fontFamily`, `gap`, `itemBorderRadius`, `itemColor`, `itemFontSize`, `itemHeight`, `itemHoverBackgroundColor`, `itemPadding`, `maxWidth`, `minWidth`, `padding`.

## Toolbar

`backgroundColor`, `border`, `boxShadow`, `controlActiveBackgroundColor`, `controlColor`, `controlHoverBackgroundColor`, `controlSelectedBackgroundColor`, `controlSelectedColor`, `separatorColor`.

| Property | Light default | Dark default |
|----------|---------------|--------------|
| controlSelectedBackgroundColor | #4A7DFF | #5B8CFF |

## Tooltip

`backgroundColor`, `border`, `boxShadow`, `color`.

## Utility Panel

`backgroundColor`, `buttonColor`, `buttonHoverBackgroundColor`, `separatorColor`.

## Watermark

`background`, `boxShadow`, `color`.

## Zoom Panel

`backgroundColor`, `border`, `borderRadius`, `boxShadow`, `buttonActiveBackgroundColor`, `buttonBorderRadius`, `buttonHoverBackgroundColor`, `buttonSize`, `gap`, `iconColor`, `padding`.