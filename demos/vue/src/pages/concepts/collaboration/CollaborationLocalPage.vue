<script setup lang="ts">

import {
  BroadcastSyncProvider,
  getEditorRef,
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
  providers: [BroadcastSyncProvider],
}

async function onReady() {
  if (editor.value) {
    await seedEditor(editor.value)
  }
}
</script>

<template>
  <div :style="{ ...hostStyle, background: 'linear-gradient(160deg, #e8fbf3 0%, #ffffff 46%)' }">
    <div :style="toolbarStyle">
      <span :style="{ fontWeight: 700, color: accentDark, fontSize: '13px' }">Cross-tab Sync</span>
      <span :style="{ fontSize: '12px', color: accentDark }">BroadcastChannel enabled</span>
    </div>
    <KritzelEditor
      ref="editor"
      editorId="collaboration-local"
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
