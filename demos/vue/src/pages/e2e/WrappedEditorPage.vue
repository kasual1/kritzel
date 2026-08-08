<script setup lang="ts">
import { KritzelEditor } from 'kritzel-vue'
import { useRoute } from 'vue-router'
import { vueThemeLight } from '../../const/vue-theme-light'

const route = useRoute()
const width = parseInt((route.query.width as string) || '320', 10)
const height = parseInt((route.query.height as string) || '600', 10)
</script>

<template>
  <div
    id="e2e-editor-wrapper"
    :style="{
      width: `${width}px`,
      height: `${height}px`,
      boxSizing: 'border-box',
      border: '4px solid #ff0080',
      background: '#fafafa',
      position: 'relative',
      overflow: 'hidden',
      margin: '24px',
    }"
  >
    <KritzelEditor
      style="width: 100%; height: 100%"
      theme="light"
      :themes="[vueThemeLight]"
    />
  </div>
</template>
