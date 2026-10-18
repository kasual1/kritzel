---
sidebar_label: Locales
displayed_sidebar: tutorialSidebar
title: "Locales | Kritzel for Vue"
description: "Understand how to customize Kritzel with locales."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Locales

## Overview

Kritzel comes with built-in support for multiple languages and allows you to override or extend the default translations with custom locales.

Take a look at the [Localization Terms](../api-reference/localization-terms.md) to see all available localization keys.

## Switching the Locale

Set the `locale` prop on `<KritzelEditor>` or call the asynchronous `setLocale()` method through the editor ref. The editor updates its UI without a page reload.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/vue"
  demoPath="/customization/localization/switch"
  repoFiles={['src/pages/customization/localization/LocalizationSwitchPage.vue']}
/>

## Listening for Locale Changes

Listen for the `localeChange` event to react when the active locale changes, for example to persist the selected language or update a custom settings panel. In Vue, the new locale is available through `event.detail`.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/vue"
  demoPath="/customization/localization/listen"
  repoFiles={['src/pages/customization/localization/LocalizationListenPage.vue']}
/>

## Registering Custom Locales

Add support for additional languages or override individual term keys by providing a `KritzelLocale` definition. Pass custom locales through the `locales` prop or register them dynamically using `registerLocales()`.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/vue"
  demoPath="/customization/localization/custom"
  repoFiles={['src/pages/customization/localization/LocalizationCustomPage.vue']}
/>

## API Details

- [Editor](../api-reference/editor.md#localization)
- [Localization Terms](../api-reference/localization-terms.md)
