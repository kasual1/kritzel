<script setup lang="ts">
import { ref } from 'vue'
import {
  type ContextMenuItem,
} from 'kritzel-vue'
import { customVueTheme } from '../../../const/custom-vue-theme'
import { editorStyle, hostStyle, seedEditor } from '../shared/concept-shared'

const editor = ref<HTMLKritzelEditorElement | null>(null)

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
  })
}
</script>

<template>
  <div :style="hostStyle">
    <kritzel-editor
      ref="editor"
      editorId="custom-context-menu-clipboard-actions"
      :wheelEnabled="false"
      theme="vue-theme"
      :themes="[customVueTheme]"
      :globalContextMenuItems="globalItems"
      :objectContextMenuItems="objectItems"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
      @isReady="onReady"
    />
  </div>
</template>
