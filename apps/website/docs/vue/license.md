---

sidebar_label: License & Watermark
displayed_sidebar: tutorialSidebar
title: "License & Watermark | Upmade for Vue"
description: "Upmade is free and open source under the MIT License. Learn how to show or hide the upmade.io watermark in your Vue application."
---

# License & Watermark

Upmade is free and open source software released under the [MIT License](/license). You can use it in personal and commercial projects without a license key.

## The upmade.io Watermark

By default, the canvas shows a small badge with the Upmade logo and "upmade.io" in the bottom-right corner that links to the Upmade website. It is hidden on phone-sized screens. Keeping it visible is an easy way to support the project and help other developers discover Upmade.

## Hiding the Watermark

If you prefer not to show the badge, set the `isWatermarkVisible` prop on `<UpmadeEditor>` or `<UpmadeEngine>` to `false`:

```html
<script setup lang="ts">
import { UpmadeEditor } from '@upmade/vue-editor'
</script>

<template>
  <UpmadeEditor
    :isWatermarkVisible="false"
    style="width: 100%; height: 100vh"
  />
</template>
```
