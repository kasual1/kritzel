---
sidebar_label: Theming & Custom Branding
displayed_sidebar: tutorialSidebar
title: "Theming & Custom Branding Example | Kritzel for Angular"
description: "Apply custom branding to the Kritzel editor — from a quick accent override to a full light/dark theme pair with branded tool palettes and host application synchronization."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Theming & Custom Branding

This page shows how to customize the visual appearance of `<kritzel-editor>` using the `KritzelTheme` interface. Each example is a self-contained, copy-paste-ready implementation for a specific branding scenario.

## Prerequisites

Complete the [Quick Start](./quick-start.md) guide to have a working `<kritzel-editor>` rendered in your application. This example builds on that setup.

---

## How Theming Works

Kritzel enables theming through the `KritzelTheme` interface instead of relying on manual CSS variable manipulation. All visual tokens are typed within properties matching this interface (e.g., `theme.global.textPrimary` or `theme.controls.backgroundColor`).

Two preset objects — `lightTheme` and `darkTheme` — are exported from `kritzel-stencil` and can be spread into a custom `KritzelTheme` object to override individual tokens while inheriting the rest. Pass custom themes via the `[themes]` input and set the active one with `[theme]`. The `themeChange` event fires whenever the user toggles the theme through the editor's settings panel, carrying the new `ThemeName`.

---

## Brand Accent Override

A product that only needs to swap the default blue accent for a brand color. Override just the `controls` and `selection` sections while inheriting everything else from `lightTheme`.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/theming-brand-accent"
  repoFiles={['src/app/examples/theming/theming-brand-accent.component.ts']}
/>

Spreading `lightTheme` and overriding only the relevant sections means future Kritzel updates to unrelated tokens are inherited automatically. The `name` field is required and must be unique — it identifies the theme when passed to the `[theme]` input.

---

## Full Custom Light Theme

A fully branded light theme that customizes every UI section — toolbar, dialogs, menus, inputs, canvas, and overlays — using a consistent purple palette. Provides complete autocomplete coverage of the `KritzelTheme` interface.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/theming-full-light"
  repoFiles={['src/app/examples/theming/theming-full-light.component.ts']}
/>

Define color constants at the top to keep the theme object DRY. Every section spreads the corresponding `lightTheme` section first, ensuring any properties you don't explicitly set remain at their defaults.

---

## Branded Light and Dark Pair

A production-ready setup with both a branded light and branded dark theme. The editor's built-in settings panel toggle switches between them, and `KritzelThemeManager.getStoredTheme()` persists the user's choice across page reloads.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/theming-light-dark-pair"
  repoFiles={['src/app/examples/theming/theming-light-dark-pair.component.ts']}
/>

Pass both themes in the `[themes]` array. The editor renders the toggle in its settings panel automatically when more than one theme is available. Each theme's `name` must be unique — the `[theme]` input binds to one of these names.

---

## Branded Drawing Tools with Theme-Aware Palette

An application that needs branded colors in the tool config panel — the brush and text tools use a custom `ThemeAwareColor` palette that resolves the correct swatch for light and dark mode automatically.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/theming-branded-tools"
  repoFiles={['src/app/examples/theming/theming-branded-tools.component.ts']}
/>

Each `ThemeAwareColor` in the palette declares a `light` and `dark` value. When the active theme is dark, Kritzel resolves each color's `dark` field for both the rendered strokes and the color swatches shown in the tool config panel. The `label` field is optional and displayed as a tooltip.

---

## Host Application Theme Synchronization

An application that needs its own UI (sidebar, header, surrounding layout) to react when the user toggles the editor's theme. Listen to `themeChange` and propagate a `data-theme` attribute on `document.documentElement` so any CSS in the host can respond.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/theming-host-sync"
  repoFiles={['src/app/examples/theming/theming-host-sync.component.ts']}
/>

Setting `data-theme` on `document.documentElement` makes the active theme queryable from any stylesheet in the application:

```css title="styles.css"
[data-theme='branded-dark'] .app-sidebar {
  background: #1a0080;
  color: #EDE7F6;
}

[data-theme='branded-dark'] .app-toolbar {
  border-color: rgba(187, 134, 252, 0.2);
}
```

`KritzelThemeManager.getStoredTheme()` reads the persisted theme preference from `localStorage` so the correct branded theme is applied on initial load without a flash of the wrong palette.
