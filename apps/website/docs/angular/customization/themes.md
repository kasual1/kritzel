---
sidebar_label: Themes
displayed_sidebar: tutorialSidebar
title: "Themes | Kritzel for Angular"
description: "Understand how to customize Kritzel with themes."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Themes

## Overview

Kritzel allows you to fully customize the appearance of the editor by providing a dedicated theming interface. A theme is a JSON-like structure containing the editor's configurable properties. You can either choose one of the built-in themes or create your own.

Kritzel comes with two built-in themes, `lightTheme` and `darkTheme`, and offers the `KritzelTheme` interface for creating custom themes.

The full list of customizable properties can be found in the [API Reference](../api-reference/theming.md).

## Switching the Theme

In order to toggle between the default light and dark theme, pass the respective theme name to the `[theme]` binding.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/angular"
  demoPath="/customization/theming/apply"
  repoFiles={['src/app/pages/customization/theming/theming-apply.component.ts']}
/>


## Listening for Theme Changes

Listen for the `themeChange` event to react whenever the active theme changes. The event provides the new theme name as its detail.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/angular"
  demoPath="/customization/theming/listen"
  repoFiles={['src/app/pages/customization/theming/theming-listen.component.ts']}
/>


## Creating a Custom Theme

Create a custom theme by overriding the groups and properties of `KritzelTheme`, and providing it as part of the editor's `[themes]` array . Similar to toggling the default themes, activate it by setting its name through the `[theme]` binding.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/angular"
  demoPath="/customization/theming/custom"
  repoFiles={['src/app/pages/customization/theming/theming-custom.component.ts']}
/>

## API Details

For the full list of related APIs, see the following reference sections.

- [Theming](../api-reference/theming.md)
