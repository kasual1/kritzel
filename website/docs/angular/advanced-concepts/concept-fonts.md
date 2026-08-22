---
sidebar_label: Custom Fonts
displayed_sidebar: tutorialSidebar
title: "Custom Fonts Concept | Kritzel for Angular"
description: "Understand the core concept of Custom Fonts in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Custom Fonts

## Overview

Typography plays a critical role in canvas-based applications, vector design tools, and document annotators. Kritzel includes a dedicated font management system (`KritzelFontRegistry`) that allows developers to register custom web fonts (such as Google Fonts, Adobe Fonts, or self-hosted `@font-face` definitions) for canvas text objects and tool panels.

When custom fonts are registered, Kritzel automatically injects the stylesheet URLs into the document, waits for font assets to load via the Browser Font Loading API (`document.fonts`), and populates the font family selection dropdown in the text tool configuration panel.

## Registering and Using Custom Fonts

You can register fonts declaratively via the `[customFonts]` binding on `<kritzel-editor>` or programmatically using `registerFonts()`. Font registrations map font keys to `KritzelFontDefinition` objects containing font family names, display labels, CSS font family stacks, and remote stylesheet URLs.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/advanced-concepts/fonts-register"
  repoFiles={['src/app/advanced-concepts/fonts/fonts-register.component.ts']}
/>

## Related API Methods

- Editor font configuration ([customFonts](../api-reference-editor.md#props), [registerFonts](../api-reference-editor.md#registerfonts))
- Font registry management (`KritzelFontRegistry.register()`, `KritzelFontRegistry.registerFonts()`, `KritzelFontRegistry.list()`)
- Font css resolution (`KritzelFontRegistry.resolveCssFontFamily()`)

For a comprehensive view, see the [API Reference](../api-reference-editor.md).
