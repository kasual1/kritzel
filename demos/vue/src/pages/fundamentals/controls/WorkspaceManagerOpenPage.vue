<script setup lang="ts">
import {
  getEditorRef,
  InMemorySyncProvider,
  KritzelEditor,
  KritzelWorkspace,
  type KritzelSyncConfig,
} from '@kritzel/vue-editor'
import { ref } from 'vue'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import { editorStyle, hostStyle, toolbarStyle } from '../../shared/demo-shared'

const editor = getEditorRef('editor')
const isWorkspaceManagerVisible = ref(true)
const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]
const syncConfig: KritzelSyncConfig = { providers: [InMemorySyncProvider] }

async function onReady() {
  await editor.value?.openWorkspaceManagerMenu()
}

function setWorkspaceManagerVisible(event: Event) {
  isWorkspaceManagerVisible.value = (event.target as HTMLInputElement).checked
}
</script>

<template>
  <div :style="hostStyle">
    <div :style="toolbarStyle">
      <label class="checkbox-control">
        <input
          type="checkbox"
          :checked="isWorkspaceManagerVisible"
          @change="setWorkspaceManagerVisible"
        />
        <span>Workspace manager</span>
      </label>
    </div>
    <KritzelEditor
      ref="editor"
      editorId="workspace-manager-open"
      theme="light"
      :themes="themes"
      :workspaces="workspaces"
      :syncConfig="syncConfig"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isWorkspaceManagerVisible="isWorkspaceManagerVisible"
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