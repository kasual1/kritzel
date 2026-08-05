<script setup lang="ts">

import {
  getEditorRef,
  KritzelEditor,
  type KritzelBaseObject,
} from 'kritzel-vue'
import { vueThemeLight } from '../../../const/vue-theme-light'
import {
  buttonStyle,
  editorStyle,
  hostStyle,
  seedEditor,
  toolbarStyle,
} from '../shared/concept-shared'
import { ref } from 'vue';

const editor = getEditorRef('editor');
const objects = ref<KritzelBaseObject<HTMLElement | SVGElement>[]>([])

async function refreshObjects() {
  const all = (await editor.value?.getAllObjects()) ?? []
  objects.value = [...(all as KritzelBaseObject<HTMLElement | SVGElement>[])].sort(
    (a, b) => a.zIndex - b.zIndex,
  )
}

async function selectAll() {
  const all = (await editor.value?.getAllObjects()) ?? []
  await editor.value?.selectObjects(all)
}

async function group() {
  await editor.value?.group()
  await refreshObjects()
}

async function ungroup() {
  await editor.value?.ungroup()
  await refreshObjects()
}

async function onReady() {
  if (!editor.value) {
    return
  }

  await seedEditor(editor.value)
  await refreshObjects()
}
</script>

<template>
  <div :style="hostStyle">
    <div :style="toolbarStyle">
      <button :style="buttonStyle(false)" @click="selectAll">Select All</button>
      <button :style="buttonStyle(false)" @click="group">Group</button>
      <button :style="buttonStyle(false)" @click="ungroup">Ungroup</button>
    </div>
    <div :style="{ display: 'flex', flex: 1, minHeight: 0 }">
      <KritzelEditor
        ref="editor"
        editorId="objects-grouping"
        theme="vue-theme"
        :themes="[vueThemeLight]"
        :isPanningEnabled="false"
        :isZoomingEnabled="false"
        :isMoreMenuVisible="false"
        :isWorkspaceManagerVisible="false"
        :style="editorStyle"
        @isReady="onReady"
      />
      <aside :style="{ width: '180px', borderLeft: '1px solid #ebebeb', padding: '8px', overflowY: 'auto', fontSize: '13px' }">
        <h3 :style="{ margin: '0 0 8px', fontSize: '14px' }">Objects</h3>
        <ul :style="{ listStyle: 'none', margin: 0, padding: 0 }">
          <li
            v-for="obj in objects"
            :key="obj.id"
            :style="{ padding: '4px 0', borderBottom: '1px solid #eee' }"
          >
            {{ obj.__class__ }}
          </li>
        </ul>
      </aside>
    </div>
  </div>
</template>
