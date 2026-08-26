---
sidebar_label: Fonts
displayed_sidebar: tutorialSidebar
title: "Custom Fonts Concept | Kritzel for React"
description: "Understand the core concept of Custom Fonts in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Custom Fonts

## Overview

Kritzel includes a dedicated `KritzelFontRegistry` for registering custom web fonts for canvas text objects and the text tool configuration panel. Fonts can come from Google Fonts, another hosted stylesheet, or a self-hosted source.

When fonts are registered, Kritzel injects stylesheet URLs and waits for the browser font loading process before rendering dependent text.

## Registering and Using Custom Fonts

Pass a `KritzelFontMap` to the `customFonts` prop on `<KritzelEditor>`, or call `registerFonts()` through the editor ref. Each registration can define a family, display label, CSS font family stack, and stylesheet source.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/react"
  demoPath="/advanced/customization/fonts-register"
  repoFiles={['src/pages/advanced/customization/fonts/FontsRegisterPage.tsx']}
/>

## Related API Methods

- Editor font configuration (`customFonts`, `registerFonts()`)
- Font registry management (`KritzelFontRegistry.register()`, `KritzelFontRegistry.registerFonts()`, `KritzelFontRegistry.list()`)
- CSS family resolution (`KritzelFontRegistry.resolveCssFontFamily()`)

For a comprehensive view, see the [API Reference](../api-reference/editor.md).
