<script setup lang="ts">
import { getEditorRef, KritzelEditor, KritzelWorkspace } from '@kritzel/vue-editor'
import { ref } from 'vue'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import { editorStyle, hostStyle, toolbarStyle } from '../../shared/demo-shared'

const editor = getEditorRef('editor')
const isMoreMenuVisible = ref(true)
const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]
const moreMenuItems = [
  {
    id: 'notify',
    label: 'Show notification',
    icon: 'settings',
    action: async () => {
      await editor.value?.triggerNotification({
        type: 'info',
        message: 'Opened from a custom More menu action',
      })
    },
  },
  {
    id: 'center-content',
    label: 'Center content',
    icon: 'selectAll',
    action: async () => {
      await editor.value?.centerAllObjects()
    },
  },
]

async function onReady() {
  await editor.value?.openMoreMenu()
}

function setMoreMenuVisible(event: Event) {
  isMoreMenuVisible.value = (event.target as HTMLInputElement).checked
}
</script>

<template>
  <div :style="hostStyle">
    <div :style="toolbarStyle">
      <label class="checkbox-control">
        <input type="checkbox" :checked="isMoreMenuVisible" @change="setMoreMenuVisible" />
        <span>More menu</span>
      </label>
    </div>
    <KritzelEditor
      ref="editor"
      editorId="more-menu-open"
      theme="light"
      :themes="themes"
      :workspaces="workspaces"
      :moreMenuItems="moreMenuItems"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="isMoreMenuVisible"
      :style="editorStyle"
      @isReady="onReady"
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