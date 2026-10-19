---
sidebar_label: Icons
displayed_sidebar: tutorialSidebar
title: "Custom Icons Concept | Kritzel for Vue"
description: "Understand how to register and use custom SVG icons in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Custom Icons

## Overview

Kritzel comes with a dedicated system for managing all icons used in the editor's user interface. You can replace built-in icons or add new ones for your own tools and components.

See the [Icons API reference](../api-reference/icons.md) for the full list of default icon names.

## Overriding Existing Icons

Override built-in icon names with your own SVG markup and pass the resulting `KritzelSvgIconMap` to the `customSvgIcons` prop on `<KritzelEditor>`.

<LiveDemo
repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/vue"
demoPath="/customization/icons/register"
repoFiles={['src/pages/customization/icons/IconsRegisterPage.vue']}
/>

## Registering New Icons

You can also register entirely new icons that are specific to your application and reference them in components with icon support, such as `KritzelToolbarItem` or `ContextMenuItem`.

<LiveDemo
repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/vue"
demoPath="/customization/icons/register-new"
repoFiles={['src/pages/customization/icons/IconsRegisterNewPage.vue']}
/>

## API Details

- [Icons](../api-reference/icons.md)
- [Editor UI Elements](../api-reference/editor.md#ui-elements)
- [Tool Management](../api-reference/editor.md#tool-management)
