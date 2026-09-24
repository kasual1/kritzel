<script setup lang="ts">
import { computed, ref, shallowRef, type CSSProperties } from 'vue'
import {
  InMemorySyncProvider,
  KritzelEditor,
  KritzelLine,
  KritzelPath,
  KritzelShape,
  KritzelWorkspace,
  ShapeType,
  type ActiveWorkspaceChangeEvent,
  type KritzelBaseObject,
  type KritzelSyncConfig,
} from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import {
  buttonStyle,
  editorStyle,
  hostStyle,
  toolbarStyle,
} from '../../shared/demo-shared'

interface WorkspacePalette {
  fill: string
  stroke: string
  accent: string
}

function createWorkspaceObjects(palette: WorkspacePalette): KritzelBaseObject[] {
  return [
    new KritzelShape({
      translateX: -140,
      translateY: -170,
      width: 120,
      height: 120,
      shapeType: ShapeType.Ellipse,
      fillColor: { light: palette.fill, dark: palette.fill },
      strokeColor: { light: palette.stroke, dark: palette.stroke },
      strokeWidth: 3,
    }),
    new KritzelShape({
      translateX: 20,
      translateY: -150,
      width: 120,
      height: 120,
      shapeType: ShapeType.Rectangle,
      fillColor: { light: palette.fill, dark: palette.fill },
      strokeColor: { light: palette.accent, dark: palette.accent },
      strokeWidth: 3,
    }),
    new KritzelLine({
      startX: -170,
      startY: 10,
      endX: 130,
      endY: 10,
      stroke: { light: palette.accent, dark: palette.accent },
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
      fill: { light: palette.stroke, dark: palette.stroke },
    }),
  ]
}

const themes = [vueThemeLight, vueThemeDark]
const syncConfig: KritzelSyncConfig = {
  providers: [InMemorySyncProvider],
}
const workspaces = shallowRef<KritzelWorkspace[]>([
  new KritzelWorkspace({
    id: 'coral',
    name: 'Coral',
    objects: createWorkspaceObjects({
      fill: '#fce4ec',
      stroke: '#c62828',
      accent: '#ff9800',
    }),
  }),
  new KritzelWorkspace({
    id: 'ocean',
    name: 'Ocean',
    objects: createWorkspaceObjects({
      fill: '#e3f2fd',
      stroke: '#1565c0',
      accent: '#00bcd4',
    }),
  }),
  new KritzelWorkspace({
    id: 'violet',
    name: 'Violet',
    objects: createWorkspaceObjects({
      fill: '#f3e5f5',
      stroke: '#6a1b9a',
      accent: '#e91e63',
    }),
  }),
  new KritzelWorkspace({
    id: 'meadow',
    name: 'Meadow',
    objects: createWorkspaceObjects({
      fill: '#e8f5e9',
      stroke: '#2e7d32',
      accent: '#8bc34a',
    }),
  }),
  new KritzelWorkspace({
    id: 'amber',
    name: 'Amber',
    objects: createWorkspaceObjects({
      fill: '#fff3e0',
      stroke: '#ef6c00',
      accent: '#795548',
    }),
  }),
  new KritzelWorkspace({
    id: 'lagoon',
    name: 'Lagoon',
    objects: createWorkspaceObjects({
      fill: '#e0f7fa',
      stroke: '#00838f',
      accent: '#3f51b5',
    }),
  }),
])
const activeWorkspaceId = ref<string | undefined>('coral')
const activeWorkspace = computed(
  () =>
    workspaces.value.find(
      (workspace) => workspace.id === activeWorkspaceId.value,
    ) ?? null,
)
const activeWorkspaceJson = computed(() => {
  const workspace = activeWorkspace.value
  if (!workspace) {
    return ''
  }

  return JSON.stringify(
    {
      ...workspace.serialize(),
      objects: workspace.objects?.map((object) => object.serialize()) ?? [],
    },
    null,
    2,
  )
})

const contentStyle: CSSProperties = {
  display: 'flex',
  flex: 1,
  minHeight: 0,
  position: 'relative',
}
const infoPanelStyle: CSSProperties = {
  width: '300px',
  padding: '12px',
  overflow: 'auto',
  borderLeft: '1px solid #ebebeb',
  background: '#ffffff',
}
const preStyle: CSSProperties = {
  margin: 0,
  overflowWrap: 'anywhere',
  whiteSpace: 'pre-wrap',
  fontFamily: 'monospace',
  fontSize: '11px',
  lineHeight: 1.45,
}

function onActiveWorkspaceChange(event: CustomEvent<ActiveWorkspaceChangeEvent>) {
  activeWorkspaceId.value = event.detail.id
}

function switchTo(workspace: KritzelWorkspace) {
  activeWorkspaceId.value = workspace.id
}
</script>

<template>
  <div :style="hostStyle">
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
    <div :style="contentStyle">
      <KritzelEditor
        editorId="workspaces-switch"
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
      <aside :style="infoPanelStyle">
        <h3>Active Workspace</h3>
        <pre :style="preStyle">{{ activeWorkspaceJson }}</pre>
      </aside>
    </div>
  </div>
</template>
