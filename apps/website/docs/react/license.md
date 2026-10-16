---

sidebar_label: License & Watermark
displayed_sidebar: tutorialSidebar
title: "License & Watermark | Kritzel for React"
description: "Kritzel is free and open source under the MIT License. Learn how to show or hide the Powered by Kritzel watermark in your React application."
---

# License & Watermark

Kritzel is free and open source software released under the [MIT License](/license). You can use it in personal and commercial projects without a license key.

## The "Powered by Kritzel" Watermark

By default, the canvas shows a small "Powered by Kritzel" badge in the bottom-right corner that links to the Kritzel website. Keeping it visible is an easy way to support the project and help other developers discover Kritzel.

## Hiding the Watermark

If you prefer not to show the badge, set the `isWatermarkVisible` prop on `<KritzelEditor>` or `<KritzelEngine>` to `false`:

```tsx
import { KritzelEditor } from '@kritzel/react-editor';

function App() {
  return (
    <KritzelEditor
      isWatermarkVisible={false}
      style={{ width: '100%', height: '100vh' }}
    />
  );
}
```
