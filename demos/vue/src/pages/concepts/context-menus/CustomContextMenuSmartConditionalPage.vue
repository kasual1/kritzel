<script setup lang="ts">

import {
  KritzelEditor,
  type ContextMenuItem,
} from 'kritzel-vue'
import { customVueTheme } from '../../../const/custom-vue-theme'
import { editorStyle, hostStyle, seedEditor, getEditorRef } from '../shared/concept-shared'

const editor = getEditorRef('editorComponent');

const globalItems: ContextMenuItem[] = [
  {
    label: 'Paste',
    icon: 'paste',
    group: 'clipboard',
    disabled: async () => ((await editor.value?.getCopiedObjects()) ?? []).length === 0,
    action: async (menu) => {
      await editor.value?.paste(menu.x, menu.y)
    },
  },
  {
    label: 'Select All',
    icon: 'select-all',
    group: 'clipboard',
    disabled: async () => ((await editor.value?.getObjectsInViewport()) ?? []).length === 0,
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
    disabled: async () => ((await editor.value?.getCopiedObjects()) ?? []).length === 0,
    action: async (menu) => {
      await editor.value?.paste(menu.x, menu.y)
    },
  },
  {
    label: 'Export as PNG',
    icon: 'download',
    group: 'export',
    visible: async (_menu, objects) => objects.length === 1,
    action: async () => {
      await editor.value?.exportSelectedObjectsAsPng()
    },
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
      ref="editorComponent"
      editorId="custom-context-menu-smart-conditional"
      theme="vue-theme"
      :themes="[customVueTheme]"
      :globalContextMenuItems="globalItems"
      :objectContextMenuItems="objectItems"
      :wheelEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
      @isReady="onReady"
    />
  </div>
</template>
