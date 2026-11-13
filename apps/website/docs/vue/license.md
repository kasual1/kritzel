---

sidebar_label: License & Watermark
displayed_sidebar: tutorialSidebar
title: "License & Watermark | Updraw for Vue"
description: "Updraw is free and open source under the MIT License. Learn how to show or hide the Powered by Updraw watermark in your Vue application."
---

# License & Watermark

Updraw is free and open source software released under the [MIT License](/license). You can use it in personal and commercial projects without a license key.

## The "Powered by Updraw" Watermark

By default, the canvas shows a small "Powered by Updraw" badge in the bottom-right corner that links to the Updraw website. Keeping it visible is an easy way to support the project and help other developers discover Updraw.

## Hiding the Watermark

If you prefer not to show the badge, set the `isWatermarkVisible` prop on `<UpdrawEditor>` or `<UpdrawEngine>` to `false`:

```html
<script setup lang="ts">
import { UpdrawEditor } from '@updraw/vue-editor'
</script>

<template>
  <UpdrawEditor
    :isWatermarkVisible="false"
    style="width: 100%; height: 100vh"
  />
</template>
```
