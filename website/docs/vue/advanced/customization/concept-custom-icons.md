---
sidebar_label: Custom Icons
displayed_sidebar: tutorialSidebar
title: "Custom Icons Concept | Kritzel for Vue"
description: "Understand how to register and use custom SVG icons in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Custom Icons

## Overview

Kritzel's icon system uses named SVG definitions. Built-in controls and menus resolve an icon name through the shared `KritzelIconRegistry`, so you can add icons for application actions without changing Kritzel's components.

Pass a `Record<string, string>` to the `customSvgIcons` prop on `<KritzelEditor>`. Use the same names anywhere Kritzel accepts an `icon`, including context-menu items and toolbar controls.

## Registering and Using Custom SVG Icons

The demo registers application-specific SVG icons and reuses their names in toolbar controls and global or object context-menu items.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/vue"
  demoPath="/advanced/customization/custom-icons"
  repoFiles={['src/pages/advanced/customization/custom-icons/CustomIconsRegisterPage.vue']}
/>

## Related API Methods and Types

- Registering icons (`customSvgIcons`, `KritzelIconRegistry.register()`, `KritzelIconRegistry.registerIcons()`)
- Toolbar configuration (`KritzelToolbarControl.icon`)
- Context-menu configuration (`ContextMenuItem.icon`)
- Editor configuration (`controls`, `globalContextMenuItems`, `objectContextMenuItems`)

For a comprehensive view, see the [API Reference](../../api-reference-editor.md).
