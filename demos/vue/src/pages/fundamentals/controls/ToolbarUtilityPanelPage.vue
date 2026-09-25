<script setup lang="ts">
import { KritzelEditor, KritzelWorkspace } from '@kritzel/vue-editor'
import { ref } from 'vue'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import { editorStyle, hostStyle, toolbarStyle } from '../../shared/demo-shared'

const isToolbarVisible = ref(true)
const isUtilityPanelVisible = ref(true)
const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]

function setToolbarVisible(event: Event) {
  isToolbarVisible.value = (event.target as HTMLInputElement).checked
}

function setUtilityPanelVisible(event: Event) {
  isUtilityPanelVisible.value = (event.target as HTMLInputElement).checked
}
</script>

<template>
  <div :style="hostStyle">
    <div :style="toolbarStyle">
      <label class="checkbox-control">
        <input type="checkbox" :checked="isToolbarVisible" @change="setToolbarVisible" />
        <span>Toolbar</span>
      </label>
      <label class="checkbox-control">
        <input type="checkbox" :checked="isUtilityPanelVisible" @change="setUtilityPanelVisible" />
        <span>Utility panel</span>
      </label>
    </div>
    <KritzelEditor
      editorId="toolbar-utility-panel"
      theme="light"
      :themes="themes"
      :workspaces="workspaces"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isToolbarVisible="isToolbarVisible"
      :isUtilityPanelVisible="isUtilityPanelVisible"
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