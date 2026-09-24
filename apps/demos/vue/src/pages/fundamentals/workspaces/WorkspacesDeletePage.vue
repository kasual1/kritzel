<script setup lang="ts">
import { ref, shallowRef, type CSSProperties } from 'vue'
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
import { editorStyle, hostStyle, toolbarStyle } from '../../shared/demo-shared'

const editor = getEditorRef('editor')
const themes = [vueThemeLight, vueThemeDark]
const syncConfig: KritzelSyncConfig = {
  providers: [InMemorySyncProvider],
}
const workspaces = shallowRef<KritzelWorkspace[]>(
  Array.from(
    { length: 6 },
    (_, index) =>
      new KritzelWorkspace({
        id: `board-${index + 1}`,
        name: `Board ${index + 1}`,
        objects: createSeedObjects(),
      }),
  ),
)
const activeWorkspaceId = ref<string | undefined>('board-1')

function workspaceTabStyle(active: boolean): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    border: `1px solid ${active ? '#42b883' : '#cccccc'}`,
    borderRadius: '4px',
    background: active ? '#42b883' : '#ffffff',
    color: active ? '#ffffff' : '#333333',
    cursor: 'pointer',
    fontSize: '13px',
  }
}
const deleteButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '14px',
  height: '14px',
  padding: 0,
  border: 0,
  background: 'transparent',
  color: 'inherit',
  cursor: 'pointer',
}

function onActiveWorkspaceChange(event: CustomEvent<ActiveWorkspaceChangeEvent>) {
  activeWorkspaceId.value = event.detail.id
}

async function switchTo(workspace: KritzelWorkspace) {
  await editor.value?.setActiveWorkspace(workspace.id)
}

async function deleteWorkspace(workspace: KritzelWorkspace, event: MouseEvent) {
  event.stopPropagation()
  if (workspaces.value.length <= 1) {
    return
  }

  const remainingWorkspaces = workspaces.value.filter(
    (candidate) => candidate.id !== workspace.id,
  )
  const shouldSelectFirstWorkspace = workspace.id === activeWorkspaceId.value

  await editor.value?.deleteWorkspace(workspace)
  workspaces.value = remainingWorkspaces

  if (shouldSelectFirstWorkspace) {
    const firstWorkspace = remainingWorkspaces[0]
    activeWorkspaceId.value = firstWorkspace.id
    await editor.value?.setActiveWorkspace(firstWorkspace.id)
  }
}
</script>

<template>
  <div :style="hostStyle">
    <div :style="toolbarStyle">
      <div
        v-for="workspace in workspaces"
        :key="workspace.id"
        :style="workspaceTabStyle(workspace.id === activeWorkspaceId)"
        @click="switchTo(workspace)"
      >
        <span>{{ workspace.name }}</span>
        <button
          v-if="workspaces.length > 1"
          type="button"
          :aria-label="`Delete ${workspace.name}`"
          :style="deleteButtonStyle"
          @click="deleteWorkspace(workspace, $event)"
        >
          X
        </button>
      </div>
    </div>
    <KritzelEditor
      ref="editor"
      editorId="workspaces-delete"
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