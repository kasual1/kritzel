<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  UpdrawBrushTool,
  UpdrawEditor,
  UpdrawEraserTool,
  UpdrawSelectionTool,
  UpdrawWorkspace,
  type UpdrawToolbarItem,
} from '@updraw/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import {
  editorStyle,
  hostStyle,
} from '../../shared/demo-shared'
import Toolbar from '../../../components/Toolbar.vue'

const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new UpdrawWorkspace({ objects: createSeedObjects() })]
const isEraserDisabled = ref(true)

const toolbarItems = computed<UpdrawToolbarItem[]>(() => [
  {
    name: 'selection',
    type: 'tool',
    isDefault: true,
    tool: UpdrawSelectionTool,
    icon: 'cursor',
  },
  {
    name: 'brush',
    type: 'tool',
    tool: UpdrawBrushTool,
    icon: 'pen',
  },
  {
    name: 'eraser',
    type: 'tool',
    tool: UpdrawEraserTool,
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
    <UpdrawEditor
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
