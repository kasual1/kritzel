---
sidebar_label: Fonts
displayed_sidebar: tutorialSidebar
title: "Custom Fonts Concept | Kritzel for Vue"
description: "Understand the core concept of Custom Fonts in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Custom Fonts

## Overview

Kritzel comes with a dedicated system for managing custom fonts, allowing you to integrate web fonts in text-based canvas objects or in the editor's UI.

## Registering Custom Fonts

Register fonts declaratively through the `customFonts` prop on `<KritzelEditor>` or programmatically using `registerFonts()`. Registered fonts immediately become available to the text tool and can be applied to the editor's UI.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/vue"
  demoPath="/customization/fonts/register"
  repoFiles={['src/pages/customization/fonts/FontsRegisterPage.vue']}
/>

## Using a Custom Font in the UI

To use a custom font in the editor's controls, first register it and then set `global.fontFamily` in a theme. This applies the font to menus, dialogs, buttons, and other UI elements.

To override only specific UI elements, set the font family on the relevant component-specific theme property, such as `dialog.fontFamily` or `contextMenu.fontFamily`.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/vue"
  demoPath="/customization/fonts/ui-font-family"
  repoFiles={['src/pages/customization/fonts/FontsUiFontFamilyPage.vue']}
/>

## API Details

For the full list of related APIs, see [Theming](../api-reference/editor.md#theming).
