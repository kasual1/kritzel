---
sidebar_label: Fonts
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
  demoPath="/customization/fonts/register"
  repoFiles={['src/app/pages/customization/fonts/fonts-register.component.ts']}
/>

## API Details

For the full list of related APIs, see the following reference sections.

- [Theming](../api-reference/editor.md#theming)
