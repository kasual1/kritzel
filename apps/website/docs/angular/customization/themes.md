---
sidebar_label: Themes
displayed_sidebar: tutorialSidebar
title: "Themes | Kritzel for Angular"
description: "Understand how to customize Kritzel with themes."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Themes

## Overview

Kritzel uses the `KritzelTheme` interface to group customizable design tokens by component, including the toolbar, menus, buttons, and selection controls. See the [theming API reference](../api-reference/theming.md) for the complete property list.

Kritzel includes built-in `lightTheme` and `darkTheme` presets. Pass themes through the `[themes]` binding and select the active theme with `[theme]`.

## Applying a Built-in Theme

The simplest entry point is switching between the two built-in themes. Pass `lightTheme` and `darkTheme` in the `[themes]` array and toggle the active theme name with `[theme]`.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/customization/theming/apply"
  repoFiles={['src/app/pages/customization/theming/theming-apply.component.ts']}
/>

## Creating a Custom Theme

This example intentionally applies a strong, light-purple visual language and removes rounding across the UI (`borderRadius: 0`) to demonstrate how far Kritzel can be customized. It starts from `lightTheme`, then overrides multiple `KritzelTheme` groups (`engine`, `toolbar`, `menu`, `contextMenu`, `button`, and more) so the editor background, toolbar, menus, and actions all follow one coherent branded style.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/customization/theming/custom"
  repoFiles={['src/app/pages/customization/theming/theming-custom.component.ts']}
/>

## API Details

For the full list of related APIs, see the following reference sections.

- [Theming](../api-reference/theming.md)
