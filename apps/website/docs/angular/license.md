---

sidebar_label: License & Watermark
displayed_sidebar: tutorialSidebar
title: "License & Watermark | Upmade for Angular"
description: "Upmade is free and open source under the MIT License. Learn how to show or hide the Powered by Upmade watermark in your Angular application."
---

# License & Watermark

Upmade is free and open source software released under the [MIT License](/license). You can use it in personal and commercial projects without a license key.

## The "Powered by Upmade" Watermark

By default, the canvas shows a small "Powered by Upmade" badge in the bottom-right corner that links to the Upmade website. Keeping it visible is an easy way to support the project and help other developers discover Upmade.

## Hiding the Watermark

If you prefer not to show the badge, set the `isWatermarkVisible` prop on `<upmade-editor>` or `<upmade-engine>` to `false`:

```html
<upmade-editor [isWatermarkVisible]="false"></upmade-editor>
```
