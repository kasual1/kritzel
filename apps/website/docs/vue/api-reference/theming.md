---
sidebar_label: Theming
title: "Theming | Updraw for Vue"
description: "Reference for every property supported by the UpdrawTheme interface."
toc_max_heading_level: 2
---

# Theming

This is the API reference for `UpdrawTheme`. It lists the theme groups and their supported properties. All values are CSS strings. Override selected values by spreading an existing preset and replacing only the groups you need.

```ts
import { lightTheme, type UpdrawTheme } from '@updraw/vue-editor'

const customTheme: UpdrawTheme = {
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

## Dynamic Object

Overrides the [Object](#object) corner radius and shadow for dynamic objects, as the CSS variables `--updraw-dynamic-object-border-radius` and `--updraw-dynamic-object-box-shadow`. Unset by default, so dynamic objects use `object.borderRadius` and `object.boxShadow`. A dynamic object's own `borderRadius` and `boxShadow` override both.

| Property | Light default | Dark default |
|----------|---------------|--------------|
| borderRadius | (`object.borderRadius`) | (`object.borderRadius`) |
| boxShadow | (`object.boxShadow`) | (`object.boxShadow`) |

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

Applies to the highlights and the picking highlight drawn inside the pages of iframe objects, see [Interacting with iFrame Content](../advanced/dynamic-objects.md#interacting-with-iframe-content). The values are applied as the CSS variables `--updraw-element-highlight-color`, `--updraw-element-highlight-background-color`, and `--updraw-element-highlight-label-text-color`. A custom highlight or picking `color` is filled with a light tint of that color instead of `backgroundColor`.

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

## Iframe

Overrides the [Object](#object) corner radius and shadow for iframe objects, as the CSS variables `--updraw-iframe-border-radius` and `--updraw-iframe-box-shadow`. Unset by default, so iframes use `object.borderRadius` and `object.boxShadow`. An iframe's own `borderRadius` and `boxShadow` override both.

| Property | Light default | Dark default |
|----------|---------------|--------------|
| borderRadius | (`object.borderRadius`) | (`object.borderRadius`) |
| boxShadow | (`object.boxShadow`) | (`object.boxShadow`) |

## Image

The corner radius and shadow of images, as the CSS variables `--updraw-image-border-radius` and `--updraw-image-drop-shadow`. Images are not cards, so they do not use the [Object](#object) defaults: the radius is unset by default, which keeps square corners. The shadow is a CSS `filter` made of `drop-shadow()` functions rather than a `box-shadow`, so it follows the visible shape of transparent images such as SVGs and icons, rounded corners included. Set it to `none` to remove it. An image's own `borderRadius` and `dropShadow` override both.

| Property | Light default | Dark default |
|----------|---------------|--------------|
| borderRadius | (unset: `0`) | (unset: `0`) |
| dropShadow | drop-shadow(0 1px 1px rgba(20, 18, 31, 0.06)) drop-shadow(0 8px 12px rgba(20, 18, 31, 0.14)) | drop-shadow(0 1px 1px rgba(0, 0, 0, 0.32)) drop-shadow(0 8px 12px rgba(0, 0, 0, 0.44)) |

## Line Endings

`hoverBackgroundColor`, `labelColor`, `optionBackground`, `selectedBackgroundColor`.

## Loading Placeholder

Applies to the placeholder the engine draws over an object while its [`isLoading`](./objects.md#loading-state) is `true`: a grey surface with rounded corners and a glare that sweeps across it. The values are applied as the CSS variables `--updraw-loading-placeholder-background-color`, `--updraw-loading-placeholder-border-radius`, `--updraw-loading-placeholder-glare-color`, `--updraw-loading-placeholder-box-shadow`, and `--updraw-loading-placeholder-animation-duration`. `borderRadius` and `boxShadow` are unset by default, so the placeholder takes the corner radius of the object it covers and `object.boxShadow`, and content keeps its corners and shadow when it replaces the placeholder. The glare stops when the user prefers reduced motion.

`animationDuration`, `backgroundColor`, `borderRadius`, `glareColor`.

| Property | Light default | Dark default |
|----------|---------------|--------------|
| animationDuration | 1.6s | 1.6s |
| backgroundColor | #e5e7eb | #2a2a2a |
| borderRadius | (the object's radius) | (the object's radius) |
| boxShadow | (`object.boxShadow`) | (`object.boxShadow`) |
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

## Object

The default corner radius and shadow of the canvas objects that are cards: [iframes](#iframe) and [dynamic objects](#dynamic-object). They are applied as the CSS variables `--updraw-object-border-radius` and `--updraw-object-box-shadow`; set the shadow to `none` to remove it. `iframe` and `dynamicObject` override them for one kind of object, and an object's own `borderRadius` and `boxShadow` override both (`'none'` removes the shadow for that object). Images have their own shadow, see [Image](#image).

An iframe's document is always clipped to its rounded corners. A dynamic object clips its content to them too, unless its `clipContent` is `false`. Inside a card object, `var(--updraw-content-border-radius)` holds its resolved radius, so content can round its own corners to match.

| Property | Light default | Dark default |
|----------|---------------|--------------|
| borderRadius | 12px | 12px |
| boxShadow | 0 1px 2px rgba(20, 18, 31, 0.06), 0 12px 32px -12px rgba(20, 18, 31, 0.22) | 0 1px 2px rgba(0, 0, 0, 0.32), 0 12px 32px -12px rgba(0, 0, 0, 0.64) |

## Object Appear

The appear animation of objects that come onto the canvas from app code or agents: objects added with the editor's `addObject()` and `addObjects()`, objects agents place with `agent.addObject()` (also with `instant`), and images picked with the image tool. They fade in while they rise into place. Objects added with one `addObjects()` call appear one after another, `stagger` apart; the tenth and later objects appear together with the ninth, and calls with more than 50 objects don't animate. Picked images appear together, with their selection. Objects the user draws, pastes or duplicates, the shapes, lines and texts agents draw, objects of collaborators, and loaded or restored documents don't appear.

The animation is purely visual: the object is at its place, with its opacity, from the start, and nothing is written to the document. An iframe appears once its document has loaded, or at once while it shows its loading placeholder, and a group once its children can. Titlebars appear with their objects and stay hidden while their object waits. Screenshots and exports show objects in place. The tokens are applied as the CSS variables `--updraw-object-appear-animation-duration`, `--updraw-object-appear-animation-easing`, `--updraw-object-appear-distance` (in canvas units) and `--updraw-object-appear-stagger`. Set `animationDuration` to `0s` to turn the animation off. Give `animationDuration` and `stagger` as plain times (`600ms`, `0.6s`), not with `calc()` or `var()`. It is also off while the user prefers reduced motion.

| Property | Light default | Dark default |
|----------|---------------|--------------|
| animationDuration | 600ms | 600ms |
| animationEasing | cubic-bezier(0.33, 1, 0.68, 1) | cubic-bezier(0.33, 1, 0.68, 1) |
| distance | 14px | 14px |
| stagger | 110ms | 110ms |

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