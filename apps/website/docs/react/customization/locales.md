---
sidebar_label: Locales
displayed_sidebar: tutorialSidebar
title: "Locales | Kritzel for React"
description: "Understand how to customize Kritzel with locales."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Locales

## Overview

Kritzel includes support for multiple languages and lets you extend or override its translations with custom locales.

See [Localization Terms](../api-reference/localization-terms.md) for all available keys.

## Switching the Locale

Set the `locale` prop on `<KritzelEditor>` or call the asynchronous `setLocale()` method through a typed editor ref. The editor updates all UI controls and context menus without a reload.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/react"
  demoPath="/customization/localization/switch"
  repoFiles={['src/pages/customization/localization/LocalizationSwitchPage.tsx']}
/>

## Listening for Locale Changes

Use `onLocaleChange` to synchronize React state, persist the selected language, or update custom controls when Kritzel changes locale. The new `LocaleCode` is available as `event.detail`.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/react"
  demoPath="/customization/localization/listen"
  repoFiles={['src/pages/customization/localization/LocalizationListenPage.tsx']}
/>

## Registering Custom Locales

Add languages such as Spanish or override individual keys such as `menu.copy` and `settings.dialogTitle` with a `KritzelLocale`. Pass custom definitions through the `locales` prop or register them dynamically with `registerLocales()`.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/react"
  demoPath="/customization/localization/custom"
  repoFiles={['src/pages/customization/localization/LocalizationCustomPage.tsx']}
/>

## API Details

- [Editor API](../api-reference/editor.md)
- [Localization Terms](../api-reference/localization-terms.md)
