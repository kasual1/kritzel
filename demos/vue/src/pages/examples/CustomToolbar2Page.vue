<script setup lang="ts">
import {
  KritzelEditor,
  KritzelBrushTool,
  KritzelSelectionTool,
  KritzelToolbarControl,
  DEFAULT_BRUSH_CONFIG,
} from 'kritzel-vue'

const controls: KritzelToolbarControl[] = [
  { type: 'tool', tool: KritzelSelectionTool, name: 'Select', icon: 'cursor' },
  { type: 'tool', tool: KritzelBrushTool, name: 'Brush', icon: 'pen', isDefault: true, config: DEFAULT_BRUSH_CONFIG },
  { type: 'config', name: 'config' },
]
</script>

<template>
  <main>
    <KritzelEditor :controls="controls" />
  </main>
</template>

<style scoped></style>
