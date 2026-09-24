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
  buttonStyle,
  editorStyle,
  hostStyle,
  toolbarStyle,
} from '../../shared/demo-shared'

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
    <div :style="toolbarStyle">
      <button :style="buttonStyle(false)" @click="selectAll">Select All</button>
      <button :style="buttonStyle(false)" @click="selectFirst">Select Object</button>
      <button :style="buttonStyle(false)" @click="clearSelection">Clear Selection</button>
    </div>
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
      <aside :style="{ width: '220px', borderLeft: '1px solid #ebebeb', padding: '8px', overflowY: 'auto', fontSize: '13px' }">
        <h3 :style="{ margin: '0 0 8px', fontSize: '14px' }">Selected</h3>
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
      </aside>
    </div>
  </div>
</template>
