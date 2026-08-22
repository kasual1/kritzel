---
sidebar_label: Custom Icons
displayed_sidebar: tutorialSidebar
title: "Custom Icons Concept | Kritzel for Angular"
description: "Understand how to register and use custom SVG icons in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Custom Icons

## Overview

Kritzel's icon system uses named SVG definitions. Built-in controls and menus resolve an icon name through the shared `KritzelIconRegistry`, so you can replace the visual language of an editor or add icons for your own application actions without changing Kritzel's components.

Register custom icons with the `[customSvgIcons]` binding on `<kritzel-editor>`. The value is a `Record<string, string>` whose keys are the icon names and whose values are SVG markup strings. Use the same names anywhere Kritzel accepts an `icon`, including `ContextMenuItem` definitions and `KritzelToolbarControl` configurations.

## Registering Custom SVG Icons

The demo registers four application-specific SVG icons and passes them to the editor. The custom names are then assigned to toolbar controls and global or object context-menu items. Context-menu actions remain ordinary callbacks; the icon name only controls the visual marker rendered beside the label.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/advanced/customization/custom-icons"
  repoFiles={['src/app/advanced/customization/custom-icons/custom-icons-register.component.ts']}
/>

## Using Icons in Controls and Menus

Toolbar controls use the `icon` property on `KritzelToolbarControl`. Context-menu entries use the `icon` property on `ContextMenuItem`. Both properties contain the key from the `[customSvgIcons]` map, and both can be mixed with Kritzel's built-in icon names.

Keep SVG definitions self-contained and use `currentColor` for strokes or fills when the icon should follow the active theme's control color. Register each name before the component renders the control or menu that references it.

## Related API Methods and Types

- Registering icons ([customSvgIcons](../../api-reference-editor.md#props), `KritzelIconRegistry.register()`, `KritzelIconRegistry.registerIcons()`)
- Toolbar configuration (`KritzelToolbarControl.icon`)
- Context-menu configuration (`ContextMenuItem.icon`)
- Related editor configuration ([controls](../../api-reference-editor.md#props), [globalContextMenuItems](../../api-reference-editor.md#props), [objectContextMenuItems](../../api-reference-editor.md#props))

For a comprehensive view, see the [API Reference](../../api-reference-editor.md).
