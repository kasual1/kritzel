<script setup lang="ts">

import {
  KritzelEditor,
  type ContextMenuItem,
} from 'kritzel-vue'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { editorStyle, hostStyle, seedEditor, getEditorRef } from '../shared/concept-shared'

const editor = getEditorRef('editor');

const globalItems: ContextMenuItem[] = [
  {
    label: 'Paste',
    icon: 'paste',
    group: 'clipboard',
    action: async (menu) => {
      await editor.value?.paste(menu.x, menu.y)
    },
  },
  {
    label: 'Select All',
    icon: 'select-all',
    group: 'clipboard',
    action: async () => {
      await editor.value?.selectAllObjectsInViewport()
    },
  },
]

const objectItems: ContextMenuItem[] = [
  {
    label: 'Copy',
    icon: 'copy',
    group: 'clipboard',
    action: async () => {
      await editor.value?.copy()
    },
  },
  {
    label: 'Paste',
    icon: 'paste',
    group: 'clipboard',
    action: async (menu) => {
      await editor.value?.paste(menu.x, menu.y)
    },
  },
  {
    label: 'Parent',
    group: 'arrange',
    children: [
      { label: 'Child 1', action: async () => window.alert('Child 1 clicked') },
      {
        label: 'Child 2',
        children: [
          { label: 'Grandchild 1', action: async () => window.alert('Grandchild 1 clicked') },
          { label: 'Grandchild 2', action: async () => window.alert('Grandchild 2 clicked') },
        ],
      },
      { label: 'Child 3', action: async () => window.alert('Child 3 clicked') },
    ],
  },
  {
    label: 'Delete',
    icon: 'delete',
    group: 'destructive',
    action: async () => {
      await editor.value?.delete()
    },
  },
]

async function onReady() {
  if (!editor.value) {
    return
  }

  await seedEditor(editor.value)
  await editor.value.selectAllObjectsInViewport()
  const selected = await editor.value.getSelectedObjects()
  if (!selected[0]) {
    return
  }

  await editor.value.openContextMenu({
    x: selected[0].translateX + 50,
    y: selected[0].translateY + 50,
    objectId: selected[0].id,
  })
}
</script>

<template>
  <div :style="hostStyle">
    <KritzelEditor
      ref="editor"
      editorId="custom-context-menu-object-inspector"
      theme="vue-theme"
      :themes="[vueThemeLight]"
      :globalContextMenuItems="globalItems"
      :objectContextMenuItems="objectItems"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
      @isReady="onReady"
    />
  </div>
</template>
