<script setup lang="ts">

import {
  getEditorRef,
  IndexedDBSyncProvider,
  KritzelEditor,
  type KritzelSyncConfig,
} from 'kritzel-vue'
import { vueThemeLight } from '../../../const/vue-theme-light'
import {
  accentDark,
  editorStyle,
  hostStyle,
  seedEditor,
  toolbarStyle,
} from '../shared/concept-shared'

const editor = getEditorRef('editor');

const syncConfig: KritzelSyncConfig = {
  providers: [IndexedDBSyncProvider],
}

async function onReady() {
  if (editor.value) {
    const existing = await editor.value.getAllObjects()
    if (existing.length > 0) {
      return
    }

    await seedEditor(editor.value)
  }
}
</script>

<template>
  <div :style="{ ...hostStyle, background: 'linear-gradient(180deg, #f3fbf8 0%, #ffffff 100%)' }">
    <div :style="toolbarStyle">
      <span :style="{ fontWeight: 700, color: accentDark, fontSize: '13px' }">Persistence Provider:</span>
      <span :style="{ fontSize: '12px', color: accentDark }">IndexedDB enabled</span>
    </div>
    <KritzelEditor
      ref="editor"
      editorId="persistence-local"
      theme="vue-theme"
      :themes="[vueThemeLight]"
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
