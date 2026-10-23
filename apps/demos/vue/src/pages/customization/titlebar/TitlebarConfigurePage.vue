<script setup lang="ts">
import { ref } from 'vue'
import {
  getEditorRef,
  KritzelEditor,
  KritzelShape,
  KritzelWorkspace,
  ShapeType,
  type KritzelObjectTitlebarActionEvent,
  type KritzelObjectTitlebarConfig,
} from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { editorStyle, hostStyle, statusBarStyle } from '../../shared/demo-shared'

const objectTitlebar: KritzelObjectTitlebarConfig = {
  // Only named frames get a titlebar; the unnamed note does not.
  showFor: object => !!object.name,
  left: [
    { type: 'button', id: 'preview', icon: 'play', variant: 'filled', tooltip: 'Preview' },
    { type: 'title', id: 'title' },
    { type: 'text', id: 'width', tone: 'muted', minBarWidth: 120, text: ({ contentSize }) => String(Math.round(contentSize.width)) },
  ],
  right: [{ type: 'button', id: 'add-breakpoint', icon: 'plus', tooltip: 'Add breakpoint' }],
}

const actionLabels: Record<string, string> = {
  preview: 'Preview',
  'add-breakpoint': 'Add breakpoint',
}

const themes = [vueThemeLight, vueThemeDark]

// Frames keep their real pixel size and are drawn at 1/5 scale, like a zoomed-out design canvas.
const frameConfig = {
  shapeType: ShapeType.Rectangle,
  fillColor: { light: '#f5f7ff', dark: '#1e2433' },
  strokeColor: { light: '#d6defa', dark: '#3b4a6b' },
  strokeWidth: 5,
  scale: 5,
}

const workspaces = [
  new KritzelWorkspace({
    objects: [
      new KritzelShape({ ...frameConfig, name: 'Desktop', translateX: -268, translateY: -130, width: 1200, height: 800 }),
      new KritzelShape({ ...frameConfig, name: 'Tablet', translateX: 4, translateY: -130, width: 768, height: 1024 }),
      new KritzelShape({ ...frameConfig, name: 'Phone', translateX: 190, translateY: -130, width: 390, height: 844 }),
      // No `name`, so `showFor` skips this note and it renders without a titlebar.
      new KritzelShape({
        translateX: -268,
        translateY: 62,
        width: 120,
        height: 80,
        shapeType: ShapeType.Rectangle,
        fillColor: { light: '#fff8e1', dark: '#4e3b12' },
        strokeColor: { light: '#f9a825', dark: '#ffd54f' },
        strokeWidth: 3,
      }),
    ],
  }),
]

const editor = getEditorRef('editor')
const lastAction = ref('Click a titlebar button')

async function onTitlebarAction(event: CustomEvent<KritzelObjectTitlebarActionEvent>) {
  const { itemId, objectId, objectType } = event.detail
  const object = await editor.value?.getObjectById(objectId)
  lastAction.value = `${actionLabels[itemId] ?? itemId} · ${object?.name ?? objectType}`
}
</script>

<template>
  <div :style="hostStyle">
    <KritzelEditor
      ref="editor"
      editorId="titlebar-configure"
      theme="light"
      :themes="themes"
      :workspaces="workspaces"
      :objectTitlebar="objectTitlebar"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
      @objectTitlebarAction="onTitlebarAction"
    />
    <div :style="statusBarStyle">
      Last action: <strong>{{ lastAction }}</strong>
    </div>
  </div>
</template>
