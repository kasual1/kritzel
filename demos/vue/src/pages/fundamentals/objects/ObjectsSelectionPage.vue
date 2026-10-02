<script setup lang="ts">
import {
  getEditorRef,
  KritzelEditor,
  KritzelWorkspace,
  type KritzelBaseObject,
} from '@kritzel/vue-editor'
import { ref } from 'vue'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import {
  editorStyle,
  hostStyle,
} from '../../shared/demo-shared'
import Toolbar from '../../../components/Toolbar.vue'
import InfoPanel from '../../../components/InfoPanel.vue'
import InfoPanelToggle from '../../../components/InfoPanelToggle.vue'
import { useInfoPanel } from '../../../components/info-panel'

const infoPanel = useInfoPanel({ hasToolbarToggle: true })

const editor = getEditorRef('editor')
const selectedObjects = ref<KritzelBaseObject[]>([])
const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]

async function refreshSelection() {
  selectedObjects.value = ((await editor.value?.getSelectedObjects()) ?? []) as KritzelBaseObject<HTMLElement | SVGElement>[]
}

async function selectAll() {
  const all = (await editor.value?.getAllObjects()) ?? []
  await editor.value?.selectObjects(all)
  await refreshSelection()
}

async function selectFirst() {
  const all = (await editor.value?.getAllObjects()) ?? []
  if (all[0]) {
    await editor.value?.selectObjects([all[0]])
    await refreshSelection()
  }
}

async function clearSelection() {
  await editor.value?.clearSelection()
}
</script>

<template>
  <div :style="hostStyle">
    <Toolbar>
      <button @click="selectAll">Select All</button>
      <button @click="selectFirst">Select Object</button>
      <button @click="clearSelection">Clear Selection</button>
      <InfoPanelToggle :panel="infoPanel" />
    </Toolbar>
    <div :style="{ display: 'flex', flex: 1, minHeight: 0 }">
      <KritzelEditor
        ref="editor"
        editorId="objects-selection"
        theme="light"
        :themes="themes"
        :workspaces="workspaces"
        :isPanningEnabled="false"
        :isZoomingEnabled="false"
        :isMoreMenuVisible="false"
        :isWorkspaceManagerVisible="false"
        :style="editorStyle"
        @objectsSelectionChange="refreshSelection"
      />
      <InfoPanel :panel="infoPanel">
        <h3>Selected</h3>
        <ul :style="{ listStyle: 'none', margin: 0, padding: 0 }">
          <li v-if="selectedObjects.length === 0" :style="{ color: '#999', fontStyle: 'italic' }">Nothing selected</li>
          <li
            v-for="obj in selectedObjects"
            :key="obj.id"
            :style="{ padding: '4px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }"
          >
            <span>{{ obj.__class__ }}</span>
            <span :style="{ color: '#999', fontFamily: 'monospace' }">{{ obj.id.slice(0, 8) }}</span>
          </li>
        </ul>
      </InfoPanel>
    </div>
  </div>
</template>
