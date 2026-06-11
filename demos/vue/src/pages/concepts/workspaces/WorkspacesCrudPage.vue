<script setup lang="ts">

import {
  InMemorySyncProvider,
  KritzelEditor,
  KritzelWorkspace,
  type ActiveWorkspaceChangeEvent,
  type KritzelSyncConfig,
} from 'kritzel-vue'
import { customVueTheme } from '../../../const/custom-vue-theme'
import {
  editorStyle,
  hostStyle,
  seedEditor,
  toolbarStyle,
  getEditorRef,
} from '../shared/concept-shared'
import { ref } from 'vue';

const editor = getEditorRef('editor');

type WorkspaceItem = Awaited<ReturnType<HTMLKritzelEditorElement['getWorkspaces']>>[number]

const workspaces = ref<WorkspaceItem[]>([])
const activeWorkspaceId = ref<string | undefined>(undefined)
const workspaceCounter = ref(1)

const syncConfig: KritzelSyncConfig = {
  providers: [InMemorySyncProvider],
}

async function refreshWorkspaces() {
  workspaces.value = (await editor.value?.getWorkspaces()) ?? []
}

async function onReady(event: CustomEvent<{ activeWorkspace: KritzelWorkspace }>) {
  if (!editor.value) {
    return
  }

  await refreshWorkspaces()
  activeWorkspaceId.value = event.detail.activeWorkspace.id
  await seedEditor(editor.value)
}

async function createWorkspace() {
  workspaceCounter.value += 1

  const workspace = new KritzelWorkspace(crypto.randomUUID(), `Board ${workspaceCounter.value}`)
  await editor.value?.createWorkspace(workspace)
  await refreshWorkspaces()
  activeWorkspaceId.value = workspace.id
}

async function deleteWorkspace(id: string) {
  const workspace = workspaces.value.find((item: { id: string; }) => item.id === id)
  if (!workspace) {
    return
  }

  const wasActive = id === activeWorkspaceId.value
  await editor.value?.deleteWorkspace(
    workspace as unknown as Parameters<HTMLKritzelEditorElement['deleteWorkspace']>[0],
  )
  const remaining = (await editor.value?.getWorkspaces()) ?? []
  workspaces.value = remaining

  if (wasActive && remaining[0]) {
    activeWorkspaceId.value = remaining[0].id
  }
}

function onActiveWorkspaceChange(event: CustomEvent<ActiveWorkspaceChangeEvent>) {
  activeWorkspaceId.value = event.detail.id
}
</script>

<template>
  <div :style="hostStyle">
    <div :style="{ ...toolbarStyle, gap: '4px', overflowX: 'auto' }">
      <div
        v-for="workspace in workspaces"
        :key="workspace.id"
        :style="{
          display: 'flex',
          border: `1px solid ${workspace.id === activeWorkspaceId ? '#42b883' : '#ccc'}`,
          borderRadius: '6px',
          overflow: 'hidden',
        }"
      >
        <button
          :style="{
            border: 'none',
            padding: '6px 8px',
            cursor: 'pointer',
            background: workspace.id === activeWorkspaceId ? '#42b883' : '#fff',
            color: workspace.id === activeWorkspaceId ? '#fff' : '#333',
          }"
          @click="activeWorkspaceId = workspace.id"
        >
          {{ workspace.name }}
        </button>
        <button
          v-if="workspaces.length > 1"
          :style="{ border: 'none', borderLeft: '1px solid #eee', background: '#fff', padding: '4px 6px', cursor: 'pointer' }"
          @click="deleteWorkspace(workspace.id)"
        >
          X
        </button>
      </div>
      <button
        :style="{ padding: '6px 12px', border: '1px dashed #aaa', borderRadius: '6px', background: 'transparent', cursor: 'pointer' }"
        @click="createWorkspace"
      >
        + New
      </button>
    </div>
    <KritzelEditor
      ref="editor"
      editorId="workspaces-crud"
      theme="vue-theme"
      :themes="[customVueTheme]"
      :wheelEnabled="false"
      :syncConfig="syncConfig"
      :activeWorkspaceId="activeWorkspaceId"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
      @isReady="onReady"
      @activeWorkspaceChange="onActiveWorkspaceChange"
    />
  </div>
</template>
