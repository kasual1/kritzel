<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import {
  getEditorRef,
  KritzelEditor,
  KritzelLine,
  KritzelPath,
  KritzelShape,
  KritzelWorkspace,
  ShapeType,
  type KritzelBaseObject,
} from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import Toolbar from '../../../components/Toolbar.vue'
import InfoPanel from '../../../components/InfoPanel.vue'

function createImportedWorkspaceObjects(): KritzelBaseObject[] {
  return [
    new KritzelShape({
      translateX: -140,
      translateY: -170,
      width: 120,
      height: 120,
      shapeType: ShapeType.Ellipse,
      fillColor: { light: '#e3f2fd', dark: '#e3f2fd' },
      strokeColor: { light: '#1565c0', dark: '#1565c0' },
      strokeWidth: 3,
    }),
    new KritzelShape({
      translateX: 20,
      translateY: -150,
      width: 120,
      height: 120,
      shapeType: ShapeType.Rectangle,
      fillColor: { light: '#e3f2fd', dark: '#e3f2fd' },
      strokeColor: { light: '#00bcd4', dark: '#00bcd4' },
      strokeWidth: 3,
    }),
    new KritzelLine({
      startX: -170,
      startY: 10,
      endX: 130,
      endY: 10,
      stroke: { light: '#00bcd4', dark: '#00bcd4' },
      strokeWidth: 3,
    }),
    new KritzelPath({
      points: [
        [0, 0, 0.5],
        [30, -40, 0.5],
        [60, -10, 0.5],
        [90, -50, 0.5],
        [120, -20, 0.5],
        [150, -60, 0.5],
        [180, -30, 0.5],
        [210, -70, 0.5],
        [240, -40, 0.5],
      ],
      translateX: -125,
      translateY: 125,
      strokeWidth: 8,
      fill: { light: '#1565c0', dark: '#1565c0' },
    }),
  ]
}

function createImportedWorkspaceJson(): string {
  const workspace = new KritzelWorkspace({
    name: 'Imported Workspace',
    objects: createImportedWorkspaceObjects(),
  })

  return JSON.stringify(
    {
      ...workspace.serialize(),
      objects: workspace.objects?.map((object) => object.serialize()) ?? [],
    },
    null,
    2,
  )
}

const editor = getEditorRef('editor')
const jsonInput = ref('')
const activeWorkspaceName = ref('')
const themes = [vueThemeLight, vueThemeDark]
const workspaces = shallowRef([
  new KritzelWorkspace({
    id: 'workspace-import-initial',
    name: 'Initial Workspace',
    objects: createSeedObjects(),
  }),
])

async function onReady(): Promise<void> {
  jsonInput.value = createImportedWorkspaceJson()
  activeWorkspaceName.value = (await editor.value?.getActiveWorkspace())?.name ?? ''
}

async function importJson(): Promise<void> {
  await editor.value?.importFromJson(jsonInput.value)
  const activeWorkspace = await editor.value?.getActiveWorkspace()
  if (!activeWorkspace) {
    return
  }

  workspaces.value = [...workspaces.value, activeWorkspace]
  activeWorkspaceName.value = activeWorkspace.name
}
</script>

<template>
  <div class="page">
    <Toolbar>
      <button type="button" @click="importJson">Import Workspace</button>
      <span class="status">Active workspace: {{ activeWorkspaceName }}</span>
    </Toolbar>
    <div class="content">
      <div class="editor-wrap">
        <KritzelEditor
          ref="editor"
          editorId="import-export-workspace-import"
          theme="light"
          :themes="themes"
          :workspaces="workspaces"
          :isPanningEnabled="false"
          :isZoomingEnabled="false"
          :isMoreMenuVisible="false"
          :isWorkspaceManagerVisible="false"
          @isReady="onReady"
        />
      </div>
      <InfoPanel width="300px">
        <h3>Workspace to Import</h3>
        <pre>{{ jsonInput }}</pre>
      </InfoPanel>
    </div>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; height: 100vh; font-family: sans-serif; }
.content { flex: 1; display: flex; min-height: 0; }
.editor-wrap { flex: 1 1 60%; position: relative; min-width: 0; }
.editor-wrap > * { display: block; height: 100%; }
pre { margin: 0; overflow-wrap: anywhere; white-space: pre-wrap; font-family: monospace; font-size: 11px; line-height: 1.45; }
</style>
