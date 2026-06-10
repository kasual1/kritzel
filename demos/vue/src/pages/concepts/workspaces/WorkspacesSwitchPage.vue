<script setup lang="ts">

import {
  InMemorySyncProvider,
  KritzelEditor,
  type ActiveWorkspaceChangeEvent,
  type KritzelSyncConfig,
  type KritzelWorkspace,
} from 'kritzel-vue'
import { customVueTheme } from '../../../const/custom-vue-theme'
import {
  buttonStyle,
  editorStyle,
  hostStyle,
  seedEditor,
  toolbarStyle,
  getEditorRef,
} from '../shared/concept-shared'
import { ref } from 'vue';

const editor = getEditorRef('editorComponent');
const workspaces = ref<KritzelWorkspace[]>([])
const activeWorkspaceId = ref<string | undefined>(undefined)

const syncConfig: KritzelSyncConfig = {
  providers: [InMemorySyncProvider],
}

async function onReady(event: CustomEvent<{ activeWorkspace: KritzelWorkspace }>) {
  if (!editor.value) {
    return
  }

  workspaces.value = (await editor.value.getWorkspaces()) as KritzelWorkspace[]
  activeWorkspaceId.value = event.detail.activeWorkspace.id
  await seedEditor(editor.value)
}

function onActiveWorkspaceChange(event: CustomEvent<ActiveWorkspaceChangeEvent>) {
  activeWorkspaceId.value = event.detail.id
}
</script>

<template>
  <div :style="hostStyle">
    <div :style="toolbarStyle">
      <button
        v-for="workspace in workspaces"
        :key="workspace.id"
        :style="buttonStyle(activeWorkspaceId === workspace.id)"
        @click="activeWorkspaceId = workspace.id"
      >
        {{ workspace.name }}
      </button>
    </div>
    <KritzelEditor
      ref="editorComponent"
      editorId="workspaces-switch"
      theme="vue-theme"
      :themes="[customVueTheme]"
      :syncConfig="syncConfig"
      :activeWorkspaceId="activeWorkspaceId"
      :wheelEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
      @isReady="onReady"
      @activeWorkspaceChange="onActiveWorkspaceChange"
    />
  </div>
</template>
