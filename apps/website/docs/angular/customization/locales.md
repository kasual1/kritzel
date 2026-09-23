---
sidebar_label: Locales
displayed_sidebar: tutorialSidebar
title: "Locales | Kritzel for Angular"
description: "Understand how to customize Kritzel with locales."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Locales

## Overview

Kritzel comes with built-in support for multiple languages and allows you to override or extend the default translations with custom locales.

Take a look at the [Localization Terms](../api-reference/localization-terms.md) to see all available localization keys.

## Switching the Locale

To change the active interface language, bind the `[locale]` property on `<kritzel-editor>` or call the asynchronous `setLocale()` method. The editor instantly updates all UI controls and context menus without requiring a page reload.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/customization/localization/switch"
  repoFiles={['src/app/pages/customization/localization/localization-switch.component.ts']}
/>

## Listening for Locale Changes

Listen for the `localeChange` event to react when the active locale changes, for example to sync a UI status label, persist the selected language, or update a custom settings panel.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/customization/localization/listen"
  repoFiles={['src/app/pages/customization/localization/localization-listen.component.ts']}
/>

## Registering Custom Locales

You can add support for additional languages (such as Spanish `'es'`) or override individual term keys (such as `menu.copy` or `settings.dialogTitle`) by providing a `KritzelLocale` definition. Pass custom locales to the `[locales]` binding or register them dynamically using `registerLocales()`.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/customization/localization/custom"
  repoFiles={['src/app/pages/customization/localization/localization-custom.component.ts']}
/>

## API Details

For the full list of related APIs, see the following reference sections.

- [Editor](../api-reference/editor.md#localization)
- [Localization Terms](../api-reference/localization-terms.md)
