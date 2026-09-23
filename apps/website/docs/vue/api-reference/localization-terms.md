---
sidebar_label: Localization Terms
title: "Localization Terms | Kritzel for Vue"
description: "Reference for the built-in localization keys available to Kritzel Vue applications."
toc_max_heading_level: 2
---

# Localization Terms

Kritzel uses the same localization keys across all framework packages. The complete key table is maintained in the Angular API reference and applies to Vue as well:

- [Complete localization terms reference](/docs/angular/api-reference/localization-terms)

Override selected keys by providing a partial custom locale. Keys you omit continue to use the default English text.

```vue
<script setup lang="ts">
import { KritzelEditor, type KritzelLocale } from '@kritzel/vue-editor';

const customEnglish: KritzelLocale = {
  code: 'en',
  label: 'English',
  terms: {
    'menu.copy': 'Duplicate',
    'settings.dialogTitle': 'Preferences',
  },
};
</script>

<template>
  <KritzelEditor :locales="[customEnglish]" />
</template>
```
