<script setup lang="ts">
import {
  KritzelEditor,
  KritzelBrushTool,
  KritzelLineTool,
  KritzelShapeTool,
  KritzelTextTool,
  KritzelSelectionTool,
  KritzelToolbarControl,
} from 'kritzel-vue'

const controls: KritzelToolbarControl[] = [
  { type: 'tool', tool: KritzelSelectionTool, name: 'Selection', icon: 'selection', isDefault: true },
  { type: 'separator', name: 'separator-1' },
  { type: 'tool', tool: KritzelBrushTool, name: 'Brush', icon: 'brush' },
  { type: 'tool', tool: KritzelLineTool, name: 'Line', icon: 'line' },
  { type: 'tool', tool: KritzelShapeTool, name: 'Shape', icon: 'shape' },
  { type: 'tool', tool: KritzelTextTool, name: 'Text', icon: 'text' },
]
</script>

<template>
  <main>
    <KritzelEditor :controls="controls" />
  </main>
</template>

<style scoped></style>
