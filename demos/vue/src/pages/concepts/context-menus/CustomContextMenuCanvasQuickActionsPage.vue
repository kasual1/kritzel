<script setup lang="ts">
import {
  getEditorRef,
  KritzelEditor,
  type ContextMenuItem,
} from 'kritzel-vue'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { editorStyle, hostStyle, seedEditor } from '../shared/concept-shared';

const editor = getEditorRef('editor');

const globalItems: ContextMenuItem[] = [
  {
    label: 'Paste',
    icon: 'paste',
    action: async (menu) => {
      await editor.value?.paste(menu.x, menu.y)
    },
  },
  {
    label: 'Select All',
    icon: 'select-all',
    action: async () => {
      await editor.value?.selectAllObjectsInViewport()
    },
  },
]

async function onReady() {
  if (!editor.value) {
    return
  }

  await seedEditor(editor.value)
  await editor.value.openContextMenu({ x: -50, y: -50 })
}
</script>

<template>
  <div :style="hostStyle">
    <KritzelEditor
      ref="editor"
      editorId="custom-context-menu-canvas-quick-actions"
      theme="vue-theme"
      :themes="[vueThemeLight]"
      :globalContextMenuItems="globalItems"
      :objectContextMenuItems="[]"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
      @isReady="onReady"
    />
  </div>
</template>
