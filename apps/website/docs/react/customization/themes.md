---
sidebar_label: Themes
displayed_sidebar: tutorialSidebar
title: "Themes | Kritzel for React"
description: "Understand how to customize Kritzel with themes."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Themes

## Overview

Kritzel allows you to fully customize the editor by providing a dedicated theming interface. A theme is a JSON-like structure containing the editor's configurable properties. You can choose a built-in theme or create your own.

Kritzel includes `lightTheme` and `darkTheme`, and exports the `KritzelTheme` interface for custom themes. Pass themes through the `themes` prop and activate one by name through the `theme` prop.

The full list of customizable properties is available in the [Theming API Reference](../api-reference/theming.md).

## Switching the Theme

To switch between light and dark themes, keep the active name in React state and pass it to `theme`. Define the `themes` array outside the component so its reference remains stable across renders.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/customization/theming/apply"
  repoFiles={['src/pages/customization/theming/ThemingApplyPage.tsx']}
/>

## Listening for Theme Changes

Use `onThemeChange` to react whenever the active theme changes. The callback receives a `CustomEvent<string>` and the new theme name is available as `event.detail`. This is useful for synchronizing React state when a theme changes from inside Kritzel settings.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/customization/theming/listen"
  repoFiles={['src/pages/customization/theming/ThemingListenPage.tsx']}
/>

## Creating a Custom Theme

Create a custom theme by extending a built-in theme and overriding the relevant `KritzelTheme` groups. Add the result to the `themes` prop and activate it by passing its `name` to `theme`.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/customization/theming/custom"
  repoFiles={['src/pages/customization/theming/ThemingCustomPage.tsx']}
/>

## API Details

- [Theming](../api-reference/theming.md)