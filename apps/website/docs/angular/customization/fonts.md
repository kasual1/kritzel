---
sidebar_label: Fonts
displayed_sidebar: tutorialSidebar
title: "Custom Fonts Concept | Kritzel for Angular"
description: "Understand the core concept of Custom Fonts in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Custom Fonts

## Overview

Kritzel lets you use custom web fonts in canvas text objects and tool panels. You can add fonts from services such as Google Fonts or Adobe Fonts, or use self-hosted fonts. Once registered, they are available in the text tool for use on canvas text.

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
