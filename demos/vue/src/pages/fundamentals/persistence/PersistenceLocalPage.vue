<script setup lang="ts">
import {
  getEditorRef,
  IndexedDBSyncProvider,
  KritzelEditor,
  type KritzelSyncConfig,
} from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import {
  editorStyle,
  hostStyle,
} from '../../shared/demo-shared'

const editor = getEditorRef('editor')
const themes = [vueThemeLight, vueThemeDark]

const syncConfig: KritzelSyncConfig = {
  providers: [IndexedDBSyncProvider],
  appStateId: 'persistence-local',
}

async function onReady() {
  const existing = await editor.value?.getAllObjects()
  if (!editor.value || !existing || existing.length > 0) {
    return
  }

  await editor.value.addObjects(createSeedObjects())
}
</script>

<template>
  <div
    :style="{
      ...hostStyle,
      color: '#333333',
      background: 'linear-gradient(180deg, #f3fbf8 0%, #ffffff 100%)',
    }"
  >
    <KritzelEditor
      ref="editor"
      editorId="persistence-local"
      theme="light"
      :themes="themes"
      :syncConfig="syncConfig"
      :loginConfig="undefined"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
      @isReady="onReady"
    />
  </div>
</template>
