<script setup lang="ts">
import {
  BroadcastSyncProvider,
  KritzelEditor,
  KritzelWorkspace,
  type KritzelSyncConfig,
} from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import {
  accentDark,
  editorStyle,
  hostStyle,
  toolbarStyle,
} from '../../shared/demo-shared'

const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]
const syncConfig: KritzelSyncConfig = {
  providers: [BroadcastSyncProvider],
}
</script>

<template>
  <div :style="{ ...hostStyle, background: 'linear-gradient(160deg, #e8fbf3 0%, #ffffff 46%)' }">
    <div :style="toolbarStyle">
      <span :style="{ fontWeight: 700, color: accentDark, fontSize: '13px' }">Cross-tab Sync</span>
      <span :style="{ fontSize: '12px', color: accentDark }">BroadcastChannel enabled</span>
    </div>
    <KritzelEditor
      editorId="collaboration-local"
      theme="light"
      :themes="themes"
      :workspaces="workspaces"
      :syncConfig="syncConfig"
      :loginConfig="undefined"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
    />
  </div>
</template>
