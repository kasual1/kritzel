---
sidebar_label: Locales
displayed_sidebar: tutorialSidebar
title: "Locales | Kritzel for React"
description: "Understand how to customize Kritzel with locales."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Locales

## Overview

Kritzel provides an internationalization framework built into the editor and core engine. User-visible text such as context menu actions, toolbar labels, settings dialogs, zoom controls, and export dialogs is resolved through the centralized `KritzelLocalizationManager`.

Kritzel ships with English (`'en'`), German (`'de'`), and French (`'fr'`) translations. You can switch languages at runtime, register custom locales, or override selected term keys. Missing terms fall back through the configured fallback locale.

## Switching Built-in Locales

Set the `locale` prop on `<KritzelEditor>` or call the asynchronous `setLocale()` method through the editor ref. The editor updates its UI without a page reload.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/react"
  demoPath="/customization/localization/switch"
  repoFiles={['src/pages/customization/localization/LocalizationSwitchPage.tsx']}
/>

## Registering Custom Locales & Term Overrides

Register a `KritzelLocale` definition through the `locales` prop or dynamically with `registerLocales()`. A locale can provide only the terms it needs; missing keys use the fallback chain.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/react"
  demoPath="/customization/localization/custom"
  repoFiles={['src/pages/customization/localization/LocalizationCustomPage.tsx']}
/>

## Related API Methods

- Setting locale (`locale`, `setLocale()`, `getLocale()`)
- Fallback locale (`fallbackLocale`)
- Registering locales (`locales`, `registerLocales()`, `getAvailableLocales()`)
- Programmatic translation (`t()`)
- Locale change events (`localeChange`)

For a comprehensive view, see the [API Reference](../api-reference/editor.md).
