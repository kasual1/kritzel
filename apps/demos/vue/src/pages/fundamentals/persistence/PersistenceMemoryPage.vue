<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import {
  InMemorySyncProvider,
  UpdrawEditor,
  UpdrawWorkspace,
  type ActiveWorkspaceChangeEvent,
  type UpdrawSyncConfig,
} from '@updraw/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import {
  editorStyle,
  hostStyle,
} from '../../shared/demo-shared'
import Toolbar from '../../../components/Toolbar.vue'

const themes = [vueThemeLight, vueThemeDark]
const syncConfig: UpdrawSyncConfig = {
  providers: [InMemorySyncProvider],
}
const workspaces = shallowRef<UpdrawWorkspace[]>([
  new UpdrawWorkspace({
    id: 'board-1',
    name: 'Board 1',
    objects: createSeedObjects(),
  }),
  new UpdrawWorkspace({
    id: 'board-2',
    name: 'Board 2',
    objects: createSeedObjects(),
  }),
  new UpdrawWorkspace({
    id: 'board-3',
    name: 'Board 3',
    objects: createSeedObjects(),
  }),
])
const activeWorkspaceId = ref<string | undefined>('board-1')

function onActiveWorkspaceChange(event: CustomEvent<ActiveWorkspaceChangeEvent>) {
  activeWorkspaceId.value = event.detail.id
}

function switchTo(workspace: UpdrawWorkspace) {
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
    <Toolbar>
      <button
        v-for="workspace in workspaces"
        :key="workspace.id"
        :class="{ active: workspace.id === activeWorkspaceId }"
        @click="switchTo(workspace)"
      >
        {{ workspace.name }}
      </button>
    </Toolbar>
    <UpdrawEditor
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