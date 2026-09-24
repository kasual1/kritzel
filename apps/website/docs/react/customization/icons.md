---
sidebar_label: Icons
displayed_sidebar: tutorialSidebar
title: "Custom Icons Concept | Kritzel for React"
description: "Understand how to register and use custom SVG icons in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Custom Icons

## Overview

Kritzel has a dedicated system for the icons used throughout the editor UI. You can replace built-in icons or add new names for application-specific tools and actions.

See the [Icons API reference](../api-reference/icons.md) for the complete list of built-in icon names.

## Overriding Existing Icons

Override built-in icons by mapping existing names to your own SVG markup and passing the map to the `customSvgIcons` prop on `<KritzelEditor>`.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/react"
  demoPath="/customization/icons/register"
  repoFiles={['src/pages/customization/icons/IconsRegisterPage.tsx']}
/>

## Registering New Icons

You can also register new icon names and reference them wherever Kritzel accepts an `icon`, including `KritzelToolbarItem` and `ContextMenuItem` definitions. Keep `customSvgIcons`, toolbar items, and context-menu arrays at module scope so their references stay stable.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/react"
  demoPath="/customization/icons/register-new"
  repoFiles={['src/pages/customization/icons/IconsRegisterNewPage.tsx']}
/>

## API Details

- [Icons](../api-reference/icons.md)
- [Editor API](../api-reference/editor.md)
- [Tools API](../api-reference/tools.md)
