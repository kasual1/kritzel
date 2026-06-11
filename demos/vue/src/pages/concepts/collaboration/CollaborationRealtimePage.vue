<script setup lang="ts">

import {
  getEditorRef,
  HocuspocusSyncProvider,
  IndexedDBSyncProvider,
  KritzelEditor,
  type KritzelSyncConfig,
} from 'kritzel-vue'
import { customVueTheme } from '../../../const/custom-vue-theme'
import {
  accentDark,
  editorStyle,
  hostStyle,
  seedEditor,
  toolbarStyle,
} from '../shared/concept-shared'

const editor = getEditorRef('editor');

const syncConfig: KritzelSyncConfig = {
  providers: [
    IndexedDBSyncProvider,
    HocuspocusSyncProvider.with({ url: 'wss://your-hocuspocus-server.com' }),
  ],
}

async function onReady() {
  if (editor.value) {
    await seedEditor(editor.value)
  }
}
</script>

<template>
  <div :style="{ ...hostStyle, background: 'radial-gradient(circle at 0% 0%, #e8fbf3 0%, #ffffff 42%)' }">
    <div :style="toolbarStyle">
      <span :style="{ fontWeight: 700, color: accentDark, fontSize: '13px' }">Real-time Sync</span>
      <span :style="{ fontSize: '12px', color: accentDark }">Configured for Hocuspocus server</span>
    </div>
    <KritzelEditor
      ref="editor"
      editorId="collaboration-realtime"
      theme="vue-theme"
      :themes="[customVueTheme]"
      :syncConfig="syncConfig"
      :loginConfig="undefined"
      :wheelEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
      @isReady="onReady"
    />
  </div>
</template>
