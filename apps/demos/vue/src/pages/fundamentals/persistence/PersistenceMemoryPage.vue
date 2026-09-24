<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import {
  InMemorySyncProvider,
  KritzelEditor,
  KritzelWorkspace,
  type ActiveWorkspaceChangeEvent,
  type KritzelSyncConfig,
} from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import {
  buttonStyle,
  editorStyle,
  hostStyle,
  toolbarStyle,
} from '../../shared/demo-shared'

const themes = [vueThemeLight, vueThemeDark]
const syncConfig: KritzelSyncConfig = {
  providers: [InMemorySyncProvider],
}
const workspaces = shallowRef<KritzelWorkspace[]>([
  new KritzelWorkspace({
    id: 'board-1',
    name: 'Board 1',
    objects: createSeedObjects(),
  }),
  new KritzelWorkspace({
    id: 'board-2',
    name: 'Board 2',
    objects: createSeedObjects(),
  }),
  new KritzelWorkspace({
    id: 'board-3',
    name: 'Board 3',
    objects: createSeedObjects(),
  }),
])
const activeWorkspaceId = ref<string | undefined>('board-1')

function onActiveWorkspaceChange(event: CustomEvent<ActiveWorkspaceChangeEvent>) {
  activeWorkspaceId.value = event.detail.id
}

function switchTo(workspace: KritzelWorkspace) {
  activeWorkspaceId.value = workspace.id
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
    <div :style="toolbarStyle">
      <button
        v-for="workspace in workspaces"
        :key="workspace.id"
        :style="buttonStyle(workspace.id === activeWorkspaceId)"
        @click="switchTo(workspace)"
      >
        {{ workspace.name }}
      </button>
    </div>
    <KritzelEditor
      editorId="persistence-memory"
      theme="light"
      :themes="themes"
      :syncConfig="syncConfig"
      :workspaces="workspaces"
      :activeWorkspaceId="activeWorkspaceId"
      :loginConfig="undefined"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
      @activeWorkspaceChange="onActiveWorkspaceChange"
    />
  </div>
</template>