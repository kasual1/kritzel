<script setup lang="ts">
import { computed, ref, shallowRef, type CSSProperties } from 'vue'
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
  editorStyle,
  hostStyle,
} from '../../shared/demo-shared'
import Toolbar from '../../../components/Toolbar.vue'
import InfoPanel from '../../../components/InfoPanel.vue'
import InfoPanelToggle from '../../../components/InfoPanelToggle.vue'
import { useInfoPanel } from '../../../components/info-panel'

const infoPanel = useInfoPanel()

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
const activeWorkspace = shallowRef<KritzelWorkspace | null>(null)
const activeWorkspaceJson = computed(() =>
  activeWorkspace.value
    ? JSON.stringify(
        activeWorkspace.value.serialize({ includeObjects: true }),
        null,
        2,
      )
    : '',
)

const contentStyle: CSSProperties = {
  display: 'flex',
  flex: 1,
  minHeight: 0,
  position: 'relative',
}
const preStyle: CSSProperties = {
  margin: 0,
  overflowWrap: 'anywhere',
  whiteSpace: 'pre-wrap',
  fontFamily: 'monospace',
  fontSize: '11px',
  lineHeight: 1.45,
}

async function refreshActiveWorkspace() {
  activeWorkspace.value = (await editor.value?.getActiveWorkspace()) ?? null
}

async function onReady() {
  await refreshActiveWorkspace()
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

async function onActiveWorkspaceChange(
  event: CustomEvent<ActiveWorkspaceChangeEvent>,
) {
  activeWorkspaceId.value = event.detail.id
  await refreshActiveWorkspace()
}
</script>

<template>
  <div :style="hostStyle">
    <Toolbar>
      <button @click="addWorkspace">Add Workspace</button>
      <span class="separator" />
      <button
        v-for="workspace in workspaces"
        :key="workspace.id"
        :class="{ active: workspace.id === activeWorkspaceId }"
        @click="switchTo(workspace)"
      >
        {{ workspace.name }}
      </button>
      <InfoPanelToggle :panel="infoPanel" />
    </Toolbar>
    <div :style="contentStyle">
      <KritzelEditor
        ref="editor"
        editorId="workspaces-read"
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
        @isReady="onReady"
        @activeWorkspaceChange="onActiveWorkspaceChange"
      />
      <InfoPanel :panel="infoPanel" width="300px">
        <h3>Active Workspace</h3>
        <pre :style="preStyle">{{ activeWorkspaceJson }}</pre>
      </InfoPanel>
    </div>
  </div>
</template>