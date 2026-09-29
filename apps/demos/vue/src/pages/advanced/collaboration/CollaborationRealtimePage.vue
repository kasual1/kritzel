<script setup lang="ts">
import {
  HocuspocusSyncProvider,
  IndexedDBSyncProvider,
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
  providers: [
    IndexedDBSyncProvider,
    HocuspocusSyncProvider.with({ url: 'wss://your-hocuspocus-server.com' }),
  ],
}

</script>

<template>
  <div :style="{ ...hostStyle, background: 'radial-gradient(circle at 0% 0%, #e8fbf3 0%, #ffffff 42%)' }">
    <Toolbar>
      <span class="label">Real-time Sync</span>
      <span class="status">Configured for Hocuspocus server</span>
    </Toolbar>
    <KritzelEditor
      editorId="collaboration-realtime"
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
