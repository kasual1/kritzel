---
sidebar_label: Fonts
displayed_sidebar: tutorialSidebar
title: "Custom Fonts Concept | Kritzel for React"
description: "Understand the core concept of Custom Fonts in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Custom Fonts

## Overview

Kritzel has a dedicated custom-font system for text objects on the canvas and for the editor UI. Fonts can come from Google Fonts, another hosted stylesheet, or a self-hosted source.

## Registering Custom Fonts

Register fonts declaratively with the `customFonts` prop on `<KritzelEditor>` or programmatically with `registerFonts()` through a typed editor ref. Registered fonts immediately become available to the text tool and can also be used by the editor UI.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/customization/fonts/register"
  repoFiles={['src/pages/customization/fonts/FontsRegisterPage.tsx']}
/>

## Using a Custom Font in the UI

Register the font first, then set `global.fontFamily` in a theme to apply it to menus, dialogs, buttons, and other controls. To override only a specific component, set its component-level theme property, such as `dialog.fontFamily` or `contextMenu.fontFamily`.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/customization/fonts/ui-font-family"
  repoFiles={['src/pages/customization/fonts/FontsUiFontFamilyPage.tsx']}
/>

## API Details

- [Editor API](../api-reference/editor.md)
