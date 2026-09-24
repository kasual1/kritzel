---
sidebar_label: Icons
displayed_sidebar: tutorialSidebar
title: "Custom Icons Concept | Kritzel for Angular"
description: "Understand how to register and use custom SVG icons in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Custom Icons

## Overview

Kritzel comes with a dedicated system for managing all icons used in the editor's user interface.
You can replace built-in icons or add new ones for your own tools and components.

See the [Icons API reference](../api-reference/icons.md) for the full list of default icon names.

## Overriding Existing Icons

The primary way to customize Kirtzel's built-in icons is to override the existing icon names with your own SVG markup and pass it to the `customSvgIcons` property when initializing the editor.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/angular"
  demoPath="/customization/icons/register"
  repoFiles={['src/app/pages/customization/icons/icons-register.component.ts']}
/>

## Registering New Icons

Of course, you can also register entirely new icons that are specific to your application and reference them in all components that have icon support, such as the `KritzelToolbarItem` or `ContextMenuItem`.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/angular"
  demoPath="/customization/icons/register-new"
  repoFiles={['src/app/pages/customization/icons/icons-register-new.component.ts']}
/>

## API Details

For the full list of related APIs, see the following reference sections.

- [Icons](../api-reference/icons.md)
- [Editor UI Elements](../api-reference/editor.md#ui-elements)
- [Tool Management](../api-reference/editor.md#tool-management)
