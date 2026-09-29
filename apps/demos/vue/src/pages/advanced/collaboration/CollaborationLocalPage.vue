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
import { editorStyle, hostStyle } from '../../shared/demo-shared'
import Toolbar from '../../../components/Toolbar.vue'

const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]
const syncConfig: KritzelSyncConfig = {
  providers: [BroadcastSyncProvider],
}
</script>

<template>
  <div :style="{ ...hostStyle, background: 'linear-gradient(160deg, #e8fbf3 0%, #ffffff 46%)' }">
    <Toolbar>
      <span class="label">Cross-tab Sync</span>
      <span class="status">BroadcastChannel enabled</span>
    </Toolbar>
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
