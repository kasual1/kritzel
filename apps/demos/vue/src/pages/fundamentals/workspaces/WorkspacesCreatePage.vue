<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import {
  getEditorRef,
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

const editor = getEditorRef('editor')
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
])
const activeWorkspaceId = ref<string | undefined>('board-1')

function onActiveWorkspaceChange(event: CustomEvent<ActiveWorkspaceChangeEvent>) {
  activeWorkspaceId.value = event.detail.id
}

async function addWorkspace() {
  const workspaceNumber = workspaces.value.length + 1
  const workspace = await editor.value?.createWorkspace(
    new KritzelWorkspace({
      id: `board-${workspaceNumber}`,
      name: `Board ${workspaceNumber}`,
      objects: createSeedObjects(),
    }),
  )

  if (workspace) {
    workspaces.value = [...workspaces.value, workspace]
    activeWorkspaceId.value = workspace.id
  }
}

async function switchTo(workspace: KritzelWorkspace) {
  await editor.value?.setActiveWorkspace(workspace.id)
}
</script>

<template>
  <div :style="hostStyle">
    <div :style="toolbarStyle">
      <button :style="buttonStyle()" @click="addWorkspace">Add Workspace</button>
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
      ref="editor"
      editorId="workspaces-create"
      theme="light"
      :themes="themes"
      :syncConfig="syncConfig"
      :workspaces="workspaces"
      :activeWorkspaceId="activeWorkspaceId"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
      @activeWorkspaceChange="onActiveWorkspaceChange"
    />
  </div>
</template>