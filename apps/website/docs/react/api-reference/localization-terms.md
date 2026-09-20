---
sidebar_label: Localization Terms
title: "Localization Terms | Kritzel for React"
description: "Reference for the built-in localization keys available to Kritzel React applications."
toc_max_heading_level: 2
---

# Localization Terms

Kritzel uses the same localization keys across all framework packages. The complete key table is maintained in the Angular API reference and applies to React as well:

- [Complete localization terms reference](/docs/angular/api-reference/localization-terms)

Override selected keys by providing a partial custom locale. Keys you omit continue to use the default English text.

```tsx
import { KritzelEditor, type KritzelLocale } from '@kritzel/react-editor';

const customEnglish: KritzelLocale = {
  code: 'en',
  label: 'English',
  terms: {
    'menu.copy': 'Duplicate',
    'settings.dialogTitle': 'Preferences',
  },
};

export function Editor() {
  return <KritzelEditor locales={[customEnglish]} />;
}
```
