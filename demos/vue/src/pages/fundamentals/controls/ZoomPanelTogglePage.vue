<script setup lang="ts">
import { KritzelEditor, KritzelWorkspace } from '@kritzel/vue-editor'
import { ref } from 'vue'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import { editorStyle, hostStyle, toolbarStyle } from '../../shared/demo-shared'

const isZoomPanelVisible = ref(true)
const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]

function setZoomPanelVisible(event: Event) {
  isZoomPanelVisible.value = (event.target as HTMLInputElement).checked
}
</script>

<template>
  <div :style="hostStyle">
    <div :style="toolbarStyle">
      <label class="checkbox-control">
        <input type="checkbox" :checked="isZoomPanelVisible" @change="setZoomPanelVisible" />
        <span>Zoom panel</span>
      </label>
    </div>
    <KritzelEditor
      editorId="zoom-panel-toggle"
      theme="light"
      :themes="themes"
      :workspaces="workspaces"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isZoomPanelVisible="isZoomPanelVisible"
      :style="editorStyle"
    />
  </div>
</template>

<style scoped>
.checkbox-control {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #333;
  font-size: 13px;
  cursor: pointer;
}
</style>