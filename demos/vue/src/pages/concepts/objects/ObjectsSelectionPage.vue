<script setup lang="ts">

import { KritzelEditor, type KritzelBaseObject } from 'kritzel-vue'
import { customVueTheme } from '../../../const/custom-vue-theme'
import {
  buttonStyle,
  editorStyle,
  hostStyle,
  seedEditor,
  toolbarStyle,
  getEditorRef,
} from '../shared/concept-shared'
import { ref } from 'vue';

const editor = getEditorRef('editor');
const selectedObjects = ref<KritzelBaseObject<HTMLElement | SVGElement>[]>([])

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
  await refreshSelection()
}

async function onReady() {
  if (!editor.value) {
    return
  }
  await seedEditor(editor.value)
}
</script>

<template>
  <div :style="hostStyle">
    <div :style="toolbarStyle">
      <button :style="buttonStyle(false)" @click="selectAll">Select All</button>
      <button :style="buttonStyle(false)" @click="selectFirst">Select First</button>
      <button :style="buttonStyle(false)" @click="clearSelection">Clear Selection</button>
      <button :style="buttonStyle(false)" @click="refreshSelection">Get Selected</button>
      <span :style="{ marginLeft: 'auto', fontSize: '13px' }">Selected: {{ selectedObjects.length }}</span>
    </div>
    <div :style="{ display: 'flex', flex: 1, minHeight: 0 }">
      <KritzelEditor
        ref="editor"
        editorId="objects-selection"
        theme="vue-theme"
        :themes="[customVueTheme]"
        :isPanningEnabled="false"
        :isZoomingEnabled="false"
        :isMoreMenuVisible="false"
        :isWorkspaceManagerVisible="false"
        :style="editorStyle"
        @isReady="onReady"
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
