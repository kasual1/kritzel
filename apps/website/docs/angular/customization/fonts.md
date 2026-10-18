---
sidebar_label: Fonts
displayed_sidebar: tutorialSidebar
title: "Custom Fonts Concept | Kritzel for Angular"
description: "Understand the core concept of Custom Fonts in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Custom Fonts

## Overview

Kritzel comes with a dedicated system for managing custom fonts, allowing you to easily integrate web fonts as part of text based objects in the canvas or in the editor's UI.

## Registering Custom Fonts

You can register fonts declaratively via the `[customFonts]` binding on `<kritzel-editor>` or programmatically using `registerFonts()`. Registered fonts come immediately available as options in the text tool and can be applied to the editor's UI.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/angular"
  demoPath="/customization/fonts/register"
  repoFiles={['src/app/pages/customization/fonts/fonts-register.component.ts']}
/>

## Using a Custom Font in the UI

To make use of a custom font in the editor's controls, you first have to register the custom font and then set `global.fontFamily` in a theme to apply a font to menus, dialogs, buttons, and other UI elements.

To override only specifc UI elements, set the font family on the relevant component-specific theme property, such as `dialog.fontFamily` or `contextMenu.fontFamily`.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/angular"
  demoPath="/customization/fonts/ui-font-family"
  repoFiles={['src/app/pages/customization/fonts/fonts-ui-font-family.component.ts']}
/>

## API Details

For the full list of related APIs, see the following reference sections.

- [Theming](../api-reference/editor.md#theming)
