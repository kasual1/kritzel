<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  KritzelBrushTool,
  KritzelEditor,
  KritzelEraserTool,
  KritzelSelectionTool,
  KritzelWorkspace,
  type KritzelToolbarItem,
} from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import {
  buttonStyle,
  editorStyle,
  hostStyle,
  toolbarStyle,
} from '../../shared/demo-shared'

const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]
const isEraserDisabled = ref(true)

const toolbarItems = computed<KritzelToolbarItem[]>(() => [
  {
    name: 'selection',
    type: 'tool',
    isDefault: true,
    tool: KritzelSelectionTool,
    icon: 'cursor',
  },
  {
    name: 'brush',
    type: 'tool',
    tool: KritzelBrushTool,
    icon: 'pen',
  },
  {
    name: 'eraser',
    type: 'tool',
    tool: KritzelEraserTool,
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
    <div :style="toolbarStyle">
      <button :style="buttonStyle(false)" @click="toggle">
        {{ isEraserDisabled ? 'Enable eraser tool' : 'Disable eraser tool' }}
      </button>
    </div>
    <KritzelEditor
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
