---
sidebar_label: Theming
displayed_sidebar: tutorialSidebar
title: "Theming Concept | Kritzel for Vue"
description: "Understand the core concept of Theming in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Theming

## Overview

Kritzel's visual appearance is fully controlled through the `KritzelTheme` interface, a structured TypeScript object that maps design tokens to every component in the editor. Each token is grouped by component category (for example, `controls`, `contextMenu`, `selection`, `button`), giving you precise control over colors, borders, shadows, and typography without touching CSS directly.

Kritzel ships two built-in themes (`lightTheme` and `darkTheme`) which serve as solid defaults or safe base objects to extend. You pass one or more `KritzelTheme` instances via the `themes` prop and activate one by name through the `theme` prop.

## Applying a Built-in Theme

The simplest entry point is switching between the two built-in themes. Pass `lightTheme` and `darkTheme` in the `themes` array and toggle the active theme name with `theme`.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/vue"
  demoPath="/advanced-concepts/customization/theming-apply"
  repoFiles={['src/pages/advanced-concepts/customization/theming/ThemingApplyPage.vue']}
/>

## Creating a Custom Theme

This example intentionally applies a strong light-purple visual language and removes rounding across the UI (`borderRadius: 0`) to demonstrate how far Kritzel can be customized. It starts from `lightTheme`, then overrides multiple `KritzelTheme` groups (`engine`, `controls`, `menu`, `contextMenu`, `button`, and more) so the editor background, controls, menus, and actions all follow one coherent branded style.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/vue"
  demoPath="/advanced-concepts/customization/theming-custom"
  repoFiles={['src/pages/advanced-concepts/customization/theming/ThemingCustomPage.vue']}
/>

## Related API Methods

- Applying themes (`theme`, `themes`)
- Built-in presets (`lightTheme`, `darkTheme`)
- Theme type (`KritzelTheme`, `ThemeName`)

For a comprehensive view, see the [API Reference](../../api-reference-editor.md).