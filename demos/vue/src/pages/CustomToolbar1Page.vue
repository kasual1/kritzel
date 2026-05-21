<script setup lang="ts">
import {
  KritzelEditor,
  KritzelBrushTool,
  KritzelSelectionTool,
  KritzelEraserTool,
  KritzelToolbarControl,
} from 'kritzel-vue'

const controls: KritzelToolbarControl[] = [
  { type: 'tool', tool: KritzelBrushTool, name: 'Brush', icon: 'brush', isDefault: true },
  { type: 'separator', name: 'separator-1' },
  { type: 'tool', tool: KritzelEraserTool, name: 'Eraser', icon: 'eraser' },
  { type: 'tool', tool: KritzelSelectionTool, name: 'Selection', icon: 'selection' },
]
</script>

<template>
  <main>
    <KritzelEditor :controls="controls" />
  </main>
</template>

<style scoped></style>
