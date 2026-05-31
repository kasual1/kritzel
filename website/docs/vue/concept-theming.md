---
sidebar_label: Theming
displayed_sidebar: tutorialSidebar
title: "Theming Concept | Kritzel for Angular"
description: "Understand the core concept of Theming in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Theming

## Overview

Kritzel's visual appearance is fully controlled through the `KritzelTheme` interface — a structured TypeScript object that maps design tokens to every component in the editor. Each token is grouped by component category (e.g. `controls`, `contextMenu`, `selection`, `button`), giving you precise control over colors, borders, shadows, and typography without touching CSS directly.

Kritzel ships two built-in themes (`lightTheme` and `darkTheme`) which serve as solid defaults or safe base objects to extend. You pass one or more `KritzelTheme` instances via the `[themes]` binding and activate one by name through the `[theme]` binding.

## Applying a Built-in Theme

The simplest entry point is switching between the two built-in themes. Pass `lightTheme` and `darkTheme` in the `[themes]` array and toggle the active theme name with `[theme]`.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/concepts/theming-apply"
  repoFiles={['src/app/concepts/theming/theming-apply.component.ts']}
/>

## Creating a Custom Theme

To apply your own brand identity, spread an existing base theme and override only the tokens you need. Every top-level section of `KritzelTheme` — such as `global`, `controls`, `selection`, `button`, and `contextMenu` — corresponds to a specific part of the editor UI. Spreading the base theme section first ensures unset tokens fall back to sensible defaults.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/concepts/theming-custom"
  repoFiles={['src/app/concepts/theming/theming-custom.component.ts']}
/>

## Related API Methods

- Applying themes (`[theme]`, `[themes]`)
- Built-in presets (`lightTheme`, `darkTheme`)
- Theme type (`KritzelTheme`, `ThemeName`)

For a comprehensive view, see the [API Reference](api-reference-editor.md).
