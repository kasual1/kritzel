---
sidebar_label: Icons
displayed_sidebar: tutorialSidebar
title: "Custom Icons Concept | Kritzel for Angular"
description: "Understand how to register and use custom SVG icons in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Custom Icons

## Overview

Kritzel's icon system uses named SVG definitions. Built-in toolbar and menus resolve an icon name through the shared `KritzelIconRegistry`, so you can replace the visual language of an editor or add icons for your own application actions without changing Kritzel's components.

Register custom icons with the `[customSvgIcons]` binding on `<kritzel-editor>`. The value is a `Record<string, string>` whose keys are the icon names and whose values are SVG markup strings. Use the same names anywhere Kritzel accepts an `icon`, including `ContextMenuItem` definitions and `KritzelToolbarItem` configurations.

## Registering Custom SVG Icons

The demo registers four application-specific SVG icons and passes them to the editor. The custom names are then assigned to toolbar items and global or object context-menu items. Context-menu actions remain ordinary callbacks; the icon name only controls the visual marker rendered beside the label.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/customization/icons/register"
  repoFiles={['src/app/pages/customization/icons/icons-register.component.ts']}
/>

## Using Icons in Toolbar Items and Menus

Toolbar items use the `icon` property on `KritzelToolbarItem`. Context-menu entries use the `icon` property on `ContextMenuItem`. Both properties contain the key from the `[customSvgIcons]` map, and both can be mixed with Kritzel's built-in icon names.

Keep SVG definitions self-contained and use `currentColor` for strokes or fills when the icon should follow the active theme's control color. Register each name before the component renders the control or menu that references it.

## API Details

For the full list of related APIs, see the following reference sections.

- [Editor UI Elements](../api-reference/editor.md#ui-elements)
- [Tool Management](../api-reference/editor.md#tool-management)
