<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  UpmadeBrushTool,
  UpmadeEditor,
  UpmadeEraserTool,
  UpmadeSelectionTool,
  UpmadeWorkspace,
  type UpmadeToolbarItem,
} from '@upmade/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import {
  editorStyle,
  hostStyle,
} from '../../shared/demo-shared'
import Toolbar from '../../../components/Toolbar.vue'

const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new UpmadeWorkspace({ objects: createSeedObjects() })]
const isEraserDisabled = ref(true)

const toolbarItems = computed<UpmadeToolbarItem[]>(() => [
  {
    name: 'selection',
    type: 'tool',
    isDefault: true,
    tool: UpmadeSelectionTool,
    icon: 'cursor',
  },
  {
    name: 'brush',
    type: 'tool',
    tool: UpmadeBrushTool,
    icon: 'pen',
  },
  {
    name: 'eraser',
    type: 'tool',
    tool: UpmadeEraserTool,
    icon: 'eraser',
    isDisabled: () => isEraserDisabled.value,
  },
  {
    name: 'config',
    type: 'config',
  },
])

function toggle() {
  isEraserDisabled.value = !isEraserDisabled.value
}
</script>

<template>
  <div :style="hostStyle">
    <Toolbar>
      <button @click="toggle">
        {{ isEraserDisabled ? 'Enable eraser tool' : 'Disable eraser tool' }}
      </button>
    </Toolbar>
    <UpmadeEditor
      editorId="tools-disable"
      theme="light"
      :themes="themes"
      :workspaces="workspaces"
      :toolbarItems="toolbarItems"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
    />
  </div>
</template>
