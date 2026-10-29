---
sidebar_label: Theming
title: "Theming | Kritzel for React"
description: "Reference for the KritzelTheme properties available to Kritzel React applications."
toc_max_heading_level: 2
---

# Theming

This is the API reference for the `KritzelTheme`. It lists the theme groups and their light and dark default values. Override selected values by spreading an existing preset and replacing only the properties you want to customize.

```tsx
import { KritzelEditor, lightTheme, type KritzelTheme } from '@kritzel/react-editor';

const customTheme: KritzelTheme = {
	...lightTheme,
	name: 'branded-purple-flat',
	global: { ...lightTheme.global, primaryColor: '#7c3aed', textPrimary: '#3b2a66' },
	engine: { ...lightTheme.engine, backgroundColor: 'transparent' },
	toolbar: {
		...lightTheme.toolbar,
		backgroundColor: '#f8f2ff',
		borderRadius: '0px',
		controlSelectedBackgroundColor: '#7c3aed',
	},
};

export function BrandedEditor() {
	return <KritzelEditor themes={[customTheme]} theme={customTheme.name} />;
}
```

## Global

| Property | Light default | Dark default |
|----------|---------------|--------------|
| borderColor | #ebebeb | #3a3a3a |
| dividerColor | #e0e0e0 | #3a3a3a |
| focusColor | #333333 | #ffffff |
| focusRingColor | #333333 | #ffffff |
| iconColor | currentColor | currentColor |
| scrollbarThumbColor | #ebebeb | #555555 |
| textPrimary | #000000 | #ffffff |
| textSecondary | #333333 | #e0e0e0 |

## Back To Content

| Property | Light default | Dark default |
|----------|---------------|--------------|
| activeBackgroundColor | hsl(0, 0%, 0%, 8.6%) | hsl(0, 0%, 100%, 12%) |
| backgroundColor | #ffffff | #2a2a2a |
| border | 1px solid #ebebeb | 1px solid #3a3a3a |
| boxShadow | 0 0 3px rgba(0, 0, 0, 0.08) | 0 0 6px rgba(0, 0, 0, 0.3) |
| color | #000000 | #ffffff |
| hoverBackgroundColor | hsl(0, 0%, 0%, 4.3%) | hsl(0, 0%, 100%, 8%) |

## Checkerboard

| Property | Light default | Dark default |
|----------|---------------|--------------|
| colorDark | #cccccc | #4a4a4a |
| colorLight | #ffffff | #3a3a3a |

## Color Palette

| Property | Light default | Dark default |
|----------|---------------|--------------|
| circleBorderColor | #dddcdc | #4a4a4a |
| hoverBackgroundColor | #ebebeb | #3a3a3a |
| selectedBackgroundColor | #ebebeb | #3a3a3a |

## Context Menu

| Property | Light default | Dark default |
|----------|---------------|--------------|
| backgroundColor | #ffffff | #2a2a2a |
| border | 1px solid #ebebeb | 1px solid #3a3a3a |
| boxShadow | 0 1px 6px rgba(0, 0, 0, 0.12) | 0 1px 8px rgba(0, 0, 0, 0.4) |
| dividerColor | rgba(0, 0, 0, 0.1) | rgba(255, 255, 255, 0.1) |
| itemActiveBackgroundColor | hsl(0, 0%, 0%, 8.6%) | hsl(0, 0%, 100%, 12%) |
| itemColor | #333333 | #e0e0e0 |
| itemDisabledColor | #aaaaaa | #666666 |
| itemHoverBackgroundColor | hsl(0, 0%, 0%, 4.3%) | hsl(0, 0%, 100%, 8%) |

## Current User Dialog

| Property | Light default | Dark default |
|----------|---------------|--------------|
| emailColor | #666666 | #999999 |
| nameColor | #333333 | #ffffff |

## Dialog

| Property | Light default | Dark default |
|----------|---------------|--------------|
| backdropColor | rgba(0, 0, 0, 0.4) | rgba(0, 0, 0, 0.6) |
| backgroundColor | #ffffff | #2a2a2a |
| border | 1px solid #ebebeb | 1px solid #3a3a3a |
| boxShadow | 0 4px 24px rgba(0, 0, 0, 0.15) | 0 4px 24px rgba(0, 0, 0, 0.5) |
| closeButtonActiveBackground | hsl(0, 0%, 0%, 8.6%) | hsl(0, 0%, 100%, 12%) |
| closeButtonBackground | transparent | transparent |
| closeButtonColor | #333333 | #e0e0e0 |
| closeButtonHoverBackground | hsl(0, 0%, 0%, 4.3%) | hsl(0, 0%, 100%, 8%) |
| closeButtonHoverColor | #000000 | #ffffff |
| fontFamily | inherit | - |
| footerBorder | 1px solid #ebebeb | 1px solid #3a3a3a |
| headerBorder | 1px solid #ebebeb | 1px solid #3a3a3a |
| titleColor | #000000 | #ffffff |

## Dropdown

| Property | Light default | Dark default |
|----------|---------------|--------------|
| accentColor | #4A7DFF | #5B8CFF |
| background | #ffffff | #1a1a1a |
| borderColor | #dbdbdb | #4a4a4a |
| borderRadius | 6px | 6px |
| hoverBackgroundColor | #f0f0f0 | #3a3a3a |
| hoverBorderColor | #cccccc | #5a5a5a |
| menuBorderRadius | 6px | 6px |
| selectedBackgroundColor | #4A7DFF1A | rgba(91, 140, 255, 0.2) |
| textColor | #333333 | #e0e0e0 |

## Editor

| Property | Light default | Dark default |
|----------|---------------|--------------|
| syncIndicatorBackground | rgba(255, 255, 255, 0.92) | rgba(30, 30, 30, 0.95) |
| syncIndicatorColor | #334155 | #e0e0e0 |
| syncIndicatorSpinnerColor | #4A7DFF | #5B8CFF |
| syncIndicatorSpinnerTrack | rgba(148, 163, 184, 0.35) | rgba(160, 160, 160, 0.3) |
| syncIndicatorZIndex | 10001 | 10001 |

## Engine

| Property | Light default | Dark default |
|----------|---------------|--------------|
| backgroundColor | #ffffff | #1a1a1a |

## Font Size

| Property | Light default | Dark default |
|----------|---------------|--------------|
| hoverBackgroundColor | #ebebeb | #3a3a3a |
| selectedBackgroundColor | #ebebeb | #3a3a3a |
| textColor | #333333 | #e0e0e0 |

## Line Endings

| Property | Light default | Dark default |
|----------|---------------|--------------|
| hoverBackgroundColor | #ebebeb | #3a3a3a |
| labelColor | #666666 | #999999 |
| optionBackground | #ffffff | #2a2a2a |
| selectedBackgroundColor | #ebebeb | #3a3a3a |

## Login Dialog

| Property | Light default | Dark default |
|----------|---------------|--------------|
| buttonActiveBackground | #ebebeb | #444444 |
| buttonBackground | #ffffff | #2a2a2a |
| buttonBorderColor | #e0e0e0 | #4a4a4a |
| buttonHoverBackground | #f5f5f5 | #3a3a3a |
| buttonHoverBorderColor | #cccccc | #5a5a5a |
| buttonTextColor | #333333 | #e0e0e0 |
| spinnerActiveColor | #333333 | #ffffff |
| spinnerColor | #cccccc | #555555 |
| subtitleColor | #666666 | #999999 |

## Master Detail

| Property | Light default | Dark default |
|----------|---------------|--------------|
| backButtonColor | #333333 | #e0e0e0 |
| backgroundColor | #ffffff | #2a2a2a |
| detailBackgroundColor | #ffffff | #2a2a2a |
| detailFocusOutline | 2px solid #333333 | 2px solid #ffffff |
| menuBackgroundColor | #ffffff | #2a2a2a |
| menuBorderRight | 1px solid #ebebeb | 1px solid #3a3a3a |
| menuItemActiveBackgroundColor | hsl(0, 0%, 0%, 8.6%) | hsl(0, 0%, 100%, 12%) |
| menuItemBackgroundColor | transparent | transparent |
| menuItemChevronColor | #aaaaaa | #666666 |
| menuItemColor | #333333 | #e0e0e0 |
| menuItemDisabledColor | #aaaaaa | #666666 |
| menuItemFocusOutline | 2px solid #333333 | 2px solid #ffffff |
| menuItemHoverBackgroundColor | hsl(0, 0%, 0%, 4.3%) | hsl(0, 0%, 100%, 8%) |
| menuItemSelectedBackgroundColor | #4A7DFF | #5B8CFF |
| menuItemSelectedColor | #ffffff | #ffffff |
| menuItemSelectedHoverBackgroundColor | #4A7DFF | #5B8CFF |

## Menu

| Property | Light default | Dark default |
|----------|---------------|--------------|
| backgroundColor | #ffffff | #2a2a2a |
| border | 1px solid #ebebeb | 1px solid #3a3a3a |
| boxShadow | 0 0 3px rgba(0, 0, 0, 0.08) | 0 0 6px rgba(0, 0, 0, 0.3) |
| itemButtonHoverBackgroundColor | hsl(0, 0%, 0%, 4.3%) | hsl(0, 0%, 100%, 8%) |
| itemChildOpenBackgroundColor | hsl(0, 0%, 0%, 3%) | hsl(0, 0%, 100%, 6%) |
| itemColor | #333333 | #e0e0e0 |
| itemEditingBackgroundColor | #f0f0f0 | #3a3a3a |
| itemInputBorder | 1px solid #333333 | 1px solid #ffffff |
| itemInputBorderColorOnSelected | #ffffff | #ffffff |
| itemInputCaretColor | #333333 | #e0e0e0 |
| itemInputCaretColorOnSelected | #ffffff | #ffffff |
| itemInputSelectionColor | #4A7DFF | #b0b0b0 |
| itemInputSelectionColorOnSelected | rgba(255, 255, 255, 0.55) | rgba(255, 255, 255, 0.35) |
| itemInputSelectionTextColor | #ffffff | #ffffff |
| itemInputSelectionTextColorOnSelected | #ffffff | #ffffff |
| itemOverlayBackgroundColor | hsl(0, 0%, 0%, 4.3%) | hsl(0, 0%, 100%, 8%) |
| itemSelectedBackgroundColor | #4A7DFF | #5B8CFF |
| itemSelectedColor | #ffffff | #ffffff |

## More Menu

| Property | Light default | Dark default |
|----------|---------------|--------------|
| backgroundColor | #ffffff | #2a2a2a |
| border | 1px solid #ebebeb | 1px solid #3a3a3a |
| borderRadius | 12px | 12px |
| boxShadow | 0 0 3px rgba(0, 0, 0, 0.08) | 0 0 6px rgba(0, 0, 0, 0.3) |
| buttonActiveBackgroundColor | hsl(0, 0%, 0%, 8.6%) | hsl(0, 0%, 100%, 12%) |
| buttonColor | #000000 | #ffffff |
| buttonHoverBackgroundColor | hsl(0, 0%, 0%, 4.3%) | hsl(0, 0%, 100%, 8%) |
| innerBorderRadius | 12px | 12px |

## Notification Card

| Property | Light default | Dark default |
|----------|---------------|--------------|
| backgroundColor | #ffffff | #2a2a2a |
| border | 1px solid #e5e7eb | 1px solid #3a3a3a |
| borderRadius | 12px | 12px |
| boxShadow | 0 8px 20px rgba(15, 23, 42, 0.08) | 0 8px 20px rgba(0, 0, 0, 0.35) |
| color | #111827 | #e0e0e0 |
| dismissButtonActiveBackgroundColor | #e5e7eb | hsl(0, 0%, 100%, 12%) |
| dismissButtonBackgroundColor | transparent | transparent |
| dismissButtonBorderRadius | 6px | 6px |
| dismissButtonColor | #4b5563 | #c7c7c7 |
| dismissButtonHoverBackgroundColor | #f3f4f6 | hsl(0, 0%, 100%, 8%) |
| dismissButtonSize | 24px | 24px |
| errorPillBackgroundColor | #fef2f2 | #4d1f24 |
| errorPillColor | #b91c1c | #ff9aa2 |
| headerGap | 8px | 8px |
| headerMarginBottom | 8px | 8px |
| headerRightGap | 6px | 6px |
| infoPillBackgroundColor | #eff6ff | #1f2f4a |
| infoPillColor | #1d4ed8 | #8bb7ff |
| maxWidth | 360px | 360px |
| messageColor | inherit | inherit |
| messageFontSize | 14px | 14px |
| messageLineHeight | 1.45 | 1.45 |
| padding | 12px 14px | 12px 14px |
| pillBackgroundColor | #eff6ff | #1f2f4a |
| pillBorderRadius | 999px | 999px |
| pillColor | #1d4ed8 | #8bb7ff |
| pillFontSize | 12px | 12px |
| pillFontWeight | 600 | 600 |
| pillHeight | 22px | 22px |
| pillPadding | 0 8px | 0 8px |
| timestampColor | #6b7280 | #a0a0a0 |
| timestampFontSize | 12px | 12px |
| warningPillBackgroundColor | #fff7ed | #4a341f |
| warningPillColor | #b45309 | #ffd29a |

## Numeric Input

| Property | Light default | Dark default |
|----------|---------------|--------------|
| borderColor | #dbdbdb | #4a4a4a |
| borderRadius | 6px | 6px |
| focusBorderColor | #333333 | #ffffff |
| hoverBorderColor | #cccccc | #5a5a5a |
| inputBackground | #ffffff | #1a1a1a |
| labelColor | #666666 | #999999 |
| selectionBackground | #4A7DFF | #5B8CFF |
| selectionColor | #ffffff | #ffffff |
| spinnerActiveBackground | hsl(0, 0%, 0%, 8.6%) | hsl(0, 0%, 100%, 12%) |
| spinnerBackground | transparent | transparent |
| spinnerBorderRadius | 5px | 5px |
| spinnerColor | #333333 | #e0e0e0 |
| spinnerHoverBackground | hsl(0, 0%, 0%, 4.3%) | hsl(0, 0%, 100%, 8%) |
| textColor | #333333 | #e0e0e0 |

## Opacity Slider

| Property | Light default | Dark default |
|----------|---------------|--------------|
| activeColor | #4A7DFF | #5B8CFF |
| thumbBorderColor | #4A7DFF | #5B8CFF |
| thumbColor | #ffffff | #ffffff |
| trackColor | #e0e0e0 | #4a4a4a |

## Pill Tabs

| Property | Light default | Dark default |
|----------|---------------|--------------|
| background | #f0f0f0 | #3a3a3a |
| tabBackground | transparent | transparent |
| tabBackgroundHover | rgba(0, 0, 0, 0.05) | rgba(255, 255, 255, 0.08) |
| tabBackgroundSelected | #ffffff | #2a2a2a |
| tabLabelMaxWidth | 10rem | 10rem |
| tabShadowSelected | 0 1px 3px rgba(0, 0, 0, 0.1) | 0 1px 3px rgba(0, 0, 0, 0.3) |
| tabTextColor | #666666 | #999999 |
| tabTextColorSelected | #000000 | #ffffff |

## Selection

| Property | Light default | Dark default |
|----------|---------------|--------------|
| borderColor | #4A7DFF | #5B8CFF |
| boxBackgroundColor | rgba(74, 125, 255, 0.2) | rgba(91, 140, 255, 0.2) |
| boxBorderColor | rgba(74, 125, 255, 0.5) | rgba(91, 140, 255, 0.5) |
| handleColor | #ffffff | #1a1a1a |
| handleStrokeColor | #4A7DFF | #5B8CFF |

## Settings

| Property | Light default | Dark default |
|----------|---------------|--------------|
| contentHeadingColor | #000000 | #ffffff |
| contentTextColor | #333333 | #e0e0e0 |
| descriptionColor | #666666 | #999999 |
| labelColor | #333333 | #e0e0e0 |
| shortcutItemBg | #f8f8f8 | #3a3a3a |
| shortcutKeyBg | #ffffff | #2a2a2a |
| shortcutKeyBorder | #e0e0e0 | #4a4a4a |
| shortcutKeyColor | #555555 | #e0e0e0 |

## Shape Fill

| Property | Light default | Dark default |
|----------|---------------|--------------|
| hoverBackgroundColor | #ebebeb | #3a3a3a |
| optionBackground | #ffffff | #2a2a2a |
| selectedBackgroundColor | #ebebeb | #3a3a3a |

## Share Dialog

| Property | Light default | Dark default |
|----------|---------------|--------------|
| borderColor | #e5e5e5 | - |
| copyButtonBackground | #ffffff | #2a2a2a |
| copyButtonColor | #666666 | #e0e0e0 |
| copyButtonHoverBackground | #e8e8e8 | #3a3a3a |
| copyButtonHoverColor | #333333 | #ffffff |
| copySuccessBackground | #d4edda | #28a745 |
| copySuccessColor | #28a745 | #ffffff |
| descriptionColor | #666666 | #e0e0e0 |
| inputBackground | #f5f5f5 | #1a1a1a |
| inputBorderColor | #e0e0e0 | #4a4a4a |
| inputTextColor | #333333 | #e0e0e0 |
| labelColor | #333333 | #e0e0e0 |
| revokeButtonBorderColor | #dc3545 | - |
| revokeButtonColor | #dc3545 | - |
| revokeButtonHoverBackground | #dc3545 | - |
| revokeButtonHoverColor | #ffffff | - |
| selectionColor | #cce5ff | #5B8CFF |

## Slide Toggle

| Property | Light default | Dark default |
|----------|---------------|--------------|
| thumbColor | #fff | #ffffff |
| thumbSize | 18px | - |
| trackCheckedColor | #4A7DFF | #5B8CFF |
| trackColor | #ccc | #4a4a4a |
| transitionDuration | - | 0.2s |

## Snap

| Property | Light default | Dark default |
|----------|---------------|--------------|
| indicatorFill | rgba(74, 125, 255, 0.3) | rgba(91, 140, 255, 0.35) |
| indicatorFillInactive | rgba(74, 125, 255, 0.18) | rgba(91, 140, 255, 0.2) |
| indicatorStroke | #4A7DFF | #5B8CFF |
| indicatorStrokeInactive | rgba(74, 125, 255, 0.5) | rgba(255, 255, 255, 0.45) |
| lineStroke | rgba(0, 0, 0, 0.2) | rgba(255, 255, 255, 0.35) |

## Split Button

| Property | Light default | Dark default |
|----------|---------------|--------------|
| backgroundColor | #ffffff | #2a2a2a |
| border | 1px solid #ebebeb | 1px solid #3a3a3a |
| boxShadow | 0 0 3px rgba(0, 0, 0, 0.08) | 0 0 6px rgba(0, 0, 0, 0.3) |
| color | #000000 | #ffffff |
| dividerBackgroundColor | #ebebeb | #3a3a3a |
| hoverBackgroundColor | hsl(0, 0%, 0%, 4.3%) | hsl(0, 0%, 100%, 8%) |

## Stroke Size

| Property | Light default | Dark default |
|----------|---------------|--------------|
| hoverBackgroundColor | #ebebeb | #3a3a3a |
| selectedBackgroundColor | #ebebeb | #3a3a3a |

## Text Input

| Property | Light default | Dark default |
|----------|---------------|--------------|
| background | #ffffff | #1a1a1a |
| borderColor | #dbdbdb | #4a4a4a |
| borderRadius | 6px | 6px |
| focusBorderColor | #333333 | #ffffff |
| hoverBorderColor | #cccccc | #5a5a5a |
| labelColor | #333333 | #e0e0e0 |
| placeholderColor | #999999 | #777777 |
| selectionBackground | #4A7DFF | #5B8CFF |
| selectionColor | #ffffff | #ffffff |
| suffixBackground | #f5f5f5 | #3a3a3a |
| suffixColor | #666666 | #aaaaaa |
| textColor | #333333 | #e0e0e0 |

## Titlebar

Applies to [object titlebars](../fundamentals/controls.md#object-titlebar). `height` and `offset` must be pixel values.

| Property | Light default | Dark default |
|----------|---------------|--------------|
| activeBackgroundColor | #e0efff | #16314c |
| activeBorder | none | none |
| activeBoxShadow | none | none |
| activeButtonFilledBackgroundColor | #007aff | #0a84ff |
| activeIconColor | #007aff | #4da3ff |
| activeMutedTextColor | rgba(0, 122, 255, 0.6) | rgba(77, 163, 255, 0.6) |
| activeTextColor | #007aff | #4da3ff |
| backgroundColor | #f2f2f2 | #282828 |
| border | none | none |
| borderRadius | 8px | 8px |
| boxShadow | none | none |
| buttonBorderRadius | 6px | 6px |
| buttonFilledBackgroundColor | #8e8e93 | #636366 |
| buttonFilledColor | #ffffff | #ffffff |
| buttonHoverBackgroundColor | rgba(0, 0, 0, 0.06) | rgba(255, 255, 255, 0.08) |
| buttonOutlineColor | currentColor | currentColor |
| buttonPressedBackgroundColor | rgba(0, 0, 0, 0.1) | rgba(255, 255, 255, 0.14) |
| buttonSize | 22px | 22px |
| focusRing | 2px solid #007aff | 2px solid #4da3ff |
| fontFamily | var(--kritzel-global-font-family, sans-serif) | var(--kritzel-global-font-family, sans-serif) |
| fontSize | 12px | 12px |
| fontWeight | 400 | 400 |
| gap | 4px | 4px |
| height | 28px | 28px |
| hoverBackgroundColor | #ededed | #2f2f2f |
| iconColor | #6b6b6b | #a0a0a0 |
| inputBackgroundColor | rgba(255, 255, 255, 0.9) | rgba(255, 255, 255, 0.12) |
| inputPadding | 3px 6px | 3px 6px |
| iconSize | 16px | 16px |
| mutedTextColor | #9a9a9a | #7a7a7a |
| offset | 6px | 6px |
| paddingX | 6px | 6px |
| selectionBackgroundColor | #007aff | #007aff |
| selectionColor | #ffffff | #ffffff |
| textColor | #5f5f5f | #b0b0b0 |
| titleFontWeight | 600 | 600 |
| transition | background-color 120ms ease, color 120ms ease | background-color 120ms ease, color 120ms ease |

## Titlebar Menu

Applies to the menu that the editor opens from a titlebar `menu` element, see [Object Titlebar](../fundamentals/controls.md#object-titlebar). The defaults match the context menu.

| Property | Light default | Dark default |
|----------|---------------|--------------|
| backgroundColor | #ffffff | #2a2a2a |
| border | 1px solid #ebebeb | 1px solid #3a3a3a |
| borderRadius | 12px | 12px |
| boxShadow | 0 1px 6px rgba(0, 0, 0, 0.12) | 0 1px 8px rgba(0, 0, 0, 0.4) |
| fontFamily | var(--kritzel-global-font-family, sans-serif) | var(--kritzel-global-font-family, sans-serif) |
| gap | 2px | 2px |
| itemBorderRadius | 12px | 12px |
| itemColor | #333333 | #e0e0e0 |
| itemFontSize | 14px | 14px |
| itemHeight | 32px | 32px |
| itemHoverBackgroundColor | hsl(0, 0%, 0%, 4.3%) | hsl(0, 0%, 100%, 8%) |
| itemPadding | 8px | 8px |
| maxWidth | 280px | 280px |
| minWidth | 140px | 140px |
| padding | 4px | 4px |

## Toolbar

| Property | Light default | Dark default |
|----------|---------------|--------------|
| backgroundColor | #ffffff | #2a2a2a |
| border | 1px solid #ebebeb | 1px solid #3a3a3a |
| boxShadow | 0 0 3px rgba(0, 0, 0, 0.08) | 0 0 6px rgba(0, 0, 0, 0.3) |
| controlActiveBackgroundColor | hsl(0, 0%, 0%, 8.6%) | hsl(0, 0%, 100%, 12%) |
| controlColor | #000000 | #ffffff |
| controlHoverBackgroundColor | hsl(0, 0%, 0%, 4.3%) | hsl(0, 0%, 100%, 8%) |
| controlSelectedBackgroundColor | #4A7DFF | #5B8CFF |
| controlSelectedColor | #ffffff | #ffffff |
| separatorColor | #ebebeb | #3a3a3a |

## Tooltip

| Property | Light default | Dark default |
|----------|---------------|--------------|
| backgroundColor | #ffffff | #2a2a2a |
| border | 1px solid #ebebeb | 1px solid #3a3a3a |
| boxShadow | 0 1px 6px rgba(0, 0, 0, 0.12) | 0 1px 8px rgba(0, 0, 0, 0.4) |
| color | #000000 | #ffffff |

## Utility Panel

| Property | Light default | Dark default |
|----------|---------------|--------------|
| backgroundColor | #e2e2e2 | #3a3a3a |
| buttonColor | #333333 | #e0e0e0 |
| buttonHoverBackgroundColor | hsl(0, 0%, 0%, 4.3%) | hsl(0, 0%, 100%, 8%) |
| separatorColor | hsl(0, 0%, 0%, 8%) | hsl(0, 0%, 100%, 12%) |

## Watermark

| Property | Light default | Dark default |
|----------|---------------|--------------|
| background | rgba(255, 255, 255, 0.6) | rgba(40, 40, 40, 0.6) |
| boxShadow | 0 1px 2px rgba(0, 0, 0, 0.12) | 0 1px 2px rgba(0, 0, 0, 0.35) |
| color | rgba(60, 60, 60, 0.75) | rgba(220, 220, 220, 0.8) |

## Zoom Panel

| Property | Light default | Dark default |
|----------|---------------|--------------|
| backgroundColor | #ffffff | #2a2a2a |
| border | 1px solid #ebebeb | 1px solid #3a3a3a |
| borderRadius | 12px | 12px |
| boxShadow | 0 0 3px rgba(0, 0, 0, 0.08) | 0 0 3px rgba(0, 0, 0, 0.4) |
| buttonActiveBackgroundColor | hsl(0, 0%, 0%, 8.6%) | hsl(0, 0%, 100%, 12%) |
| buttonBorderRadius | 8px | 8px |
| buttonHoverBackgroundColor | hsl(0, 0%, 0%, 4.3%) | hsl(0, 0%, 100%, 8%) |
| buttonSize | 32px | 32px |
| gap | 4px | 4px |
| iconColor | #000000 | #e0e0e0 |
| padding | 4px | 4px |