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

## Overriding Existing Icons

The simplest way to customize Kritzel's built-in UI is to register SVG markup under the existing icon names. The editor's default toolbar and panels already refer to keys such as `cursor`, `pen`, `shape-rectangle`, `undo`, `redo`, and `delete`, so overriding those keys changes the artwork without redefining `toolbarItems` or replacing the built-in actions.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/customization/icons/register"
  repoFiles={['src/app/pages/customization/icons/icons-register.component.ts']}
/>

## Registering Brand-New Icons

Use a new name for an application-specific action or tool. This demo registers `brand-export` and uses it in custom context-menu entries.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/customization/icons/register-new"
  repoFiles={['src/app/pages/customization/icons/icons-register-new.component.ts']}
/>

Use `currentColor` when the SVG should follow the control color. Reference the new key from a `KritzelToolbarItem` or `ContextMenuItem` to display it.

## API Details

For the full list of related APIs, see the following reference sections.

- [Editor UI Elements](../api-reference/editor.md#ui-elements)
- [Tool Management](../api-reference/editor.md#tool-management)
