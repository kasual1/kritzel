---
sidebar_label: Theming & Custom Branding
displayed_sidebar: tutorialSidebar
title: "Theming & Custom Branding Example | Kritzel for Angular"
description: "Build a coherent custom theme step by step, from overriding accent colors through a full branded light/dark pair to syncing the active theme with the host application."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Theming & Custom Branding

This guide builds up a custom Kritzel theme step by step, starting from a bare minimum and progressively adding configuration until reaching a fully controlled setup.

## Prerequisites

Complete the [Quick Start](./quick-start.md) guide to have a working `<kritzel-editor>` rendered in your application. This example builds on that setup.

---

## How Theming Works

Kritzel enables theming through the `KritzelTheme` interface instead of relying on manual CSS variable manipulation. All visual tokens are typed within properties matching this interface (e.g., `theme.global.textPrimary` or `theme.controls.backgroundColor`).

Two preset objects — `lightTheme` and `darkTheme` — are exported from `kritzel-stencil` and can be spread into a custom `KritzelTheme` object to override individual tokens while inheriting the rest. The `ThemeHelper.applyThemeToElement` utility can then be used to inject the theme configuration securely across the editor instances. The `themeChange` event fires whenever the user toggles the theme through the editor's settings panel, carrying the new `ThemeName` (`'light'` or `'dark'`).

---

## Step 1: Overriding Accent Colors

Provide a minimal `KritzelTheme` object and use `ThemeHelper` to apply it once the editor signals it is ready. This allows replacing the default blue accent with a brand color:

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/theming-1"
  repoFiles={['src/app/examples/theming/theming-1.component.ts']}
/>

Providing these object keys changes the toolbar's active-tool indicator (background and icon color) and the selection rectangle (border and resize handle fill), without needing to remember exact CSS properties.

---

## Step 2: Building a Full Branded Light Theme

Building a fully custom typed `KritzelTheme` object provides autocomplete on every section and keeps the full theme in one place. Apply it once after the editor is ready:

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/theming-2"
  repoFiles={['src/app/examples/theming/theming-2.component.ts']}
/>

`ThemeHelper.applyThemeToElement` reads the provided `KritzelTheme` object and handles application correctly under the hood.

---

## Step 3: Adding a Custom Dark Variant

Add a paired dark theme object and re-apply the correct theme whenever the user toggles via the settings panel:

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/theming-3"
  repoFiles={['src/app/examples/theming/theming-3.component.ts']}
/>

`KritzelThemeManager.getStoredTheme()` reads the persisted theme preference from `localStorage` so the branded theme is applied correctly even when the user returns with dark mode already active. `onThemeChange` re-applies whichever custom theme matches the new name every time the user switches.

---

## Step 4: Using ThemeAwareColor in Tool Configs

Override the `controls` input to give each drawing tool a branded color palette. `ThemeAwareColor` objects hold a `light` and `dark` value, and Kritzel automatically resolves the correct one based on the active theme:

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/theming-4"
  repoFiles={['src/app/examples/theming/theming-4.component.ts']}
/>

Each `ThemeAwareColor` in `BRAND_PALETTE` declares a `light` and `dark` value. When the active theme is `'dark'`, Kritzel resolves each color's `dark` field for both the rendered strokes and the color swatches shown in the tool config panel.

---

## Step 5: Syncing themeChange to the Host Application

Propagate the editor's active theme to the surrounding page by writing a `data-theme` attribute onto `document.documentElement`, giving the rest of the application a CSS hook to react:

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/theming-5"
  repoFiles={['src/app/examples/theming/theming-5.component.ts']}
/>

Setting `data-theme` on `document.documentElement` makes the active theme queryable from any stylesheet in the application:

```css title="styles.css"
[data-theme='dark'] .app-sidebar {
  background: #1a0080;
  color: #EDE7F6;
}

[data-theme='dark'] .app-toolbar {
  border-color: rgba(187, 134, 252, 0.2);
}
```

The `activeTheme` signal carries the same value for any Angular component that needs to adjust its template or styles reactively.
