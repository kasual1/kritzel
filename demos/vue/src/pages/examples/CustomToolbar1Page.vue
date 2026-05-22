<script setup lang="ts">
import {
  KritzelEditor,
  KritzelBrushTool,
  KritzelSelectionTool,
  KritzelToolbarControl,
} from 'kritzel-vue'

const controls: KritzelToolbarControl[] = [
  { type: 'tool', tool: KritzelSelectionTool, name: 'Select', icon: 'cursor', isDefault: true },
  { type: 'tool', tool: KritzelBrushTool, name: 'Brush', icon: 'pen' },
]
</script>

<template>
  <main>
    <KritzelEditor :controls="controls" />
  </main>
</template>

<style scoped></style>
