---
sidebar_label: Themes
displayed_sidebar: tutorialSidebar
title: "Themes | Kritzel for Vue"
description: "Understand how to customize Kritzel with themes."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Themes

## Overview

Kritzel allows you to fully customize the appearance of the editor through a dedicated theming interface. A theme is a JSON-like structure containing the editor's configurable properties. You can either choose one of the built-in themes or create your own.

Kritzel comes with two built-in themes, `lightTheme` and `darkTheme`, and offers the `KritzelTheme` interface for creating custom themes.

The full list of customizable properties can be found in the [API Reference](../api-reference/theming.md).

## Switching the Theme

To toggle between the default light and dark theme, pass the respective theme name to the `theme` prop.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/vue"
  demoPath="/customization/theming/apply"
  repoFiles={['src/pages/customization/theming/ThemingApplyPage.vue']}
/>

## Listening for Theme Changes

Listen for the `themeChange` event to react whenever the active theme changes. The event provides the new theme name through `event.detail`.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/vue"
  demoPath="/customization/theming/listen"
  repoFiles={['src/pages/customization/theming/ThemingListenPage.vue']}
/>

## Creating a Custom Theme

Create a custom theme by overriding the groups and properties of `KritzelTheme`, then provide it through the editor's `themes` prop. Activate it by passing its name to the `theme` prop.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/vue"
  demoPath="/customization/theming/custom"
  repoFiles={['src/pages/customization/theming/ThemingCustomPage.vue']}
/>

## API Details

For the full list of related APIs, see [Theming](../api-reference/theming.md).