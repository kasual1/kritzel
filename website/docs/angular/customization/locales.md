---
sidebar_label: Locales
displayed_sidebar: tutorialSidebar
title: "Locales | Kritzel for Angular"
description: "Understand how to customize Kritzel with locales."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Locales

## Overview

Kritzel provides a comprehensive internationalization (i18n) framework built directly into the editor and core engine. Every user-visible text element — from context menu actions and toolbar button tooltips to settings dialogs, zoom panels, utility controls, and export dialogs — is managed dynamically through a centralized localization manager (`KritzelLocalizationManager`).

Kritzel ships with built-in translations for English (`'en'`), German (`'de'`), and French (`'fr'`). You can switch active languages at runtime, define custom locale packages, or partially override specific UI string keys. All missing terms automatically fall back through a flexible resolution chain down to the configurable fallback locale (defaulting to `'en'`).

## Switching Built-in Locales

To change the active interface language, bind the `[locale]` property on `<kritzel-editor>` or call the asynchronous `setLocale()` method. The editor instantly updates all UI controls and context menus without requiring a page reload.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/customization/localization/switch"
  repoFiles={['src/app/customization/localization/localization-switch.component.ts']}
/>

## Registering Custom Locales & Term Overrides

You can add support for additional languages (such as Spanish `'es'`) or override individual term keys (such as `menu.copy` or `settings.dialogTitle`) by providing a `KritzelLocale` definition. Pass custom locales to the `[locales]` binding or register them dynamically using `registerLocales()`.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/customization/localization/custom"
  repoFiles={['src/app/customization/localization/localization-custom.component.ts']}
/>

## API Details

For the full list of available APIs, see the following reference sections.

- [Localization](../api-reference/editor.md#localization)
