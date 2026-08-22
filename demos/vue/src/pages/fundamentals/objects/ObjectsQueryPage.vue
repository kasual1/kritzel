<script setup lang="ts">

import {
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
  getEditorRef,
} from '../shared/concept-shared'
import { ref } from 'vue';

const editor = getEditorRef('editor');
const results = ref<KritzelBaseObject<HTMLElement | SVGElement>[]>([])
const totalCount = ref(0)

async function queryAll() {
  results.value = ((await editor.value?.getAllObjects()) ?? []) as KritzelBaseObject<HTMLElement | SVGElement>[]
  totalCount.value = (await editor.value?.getObjectsTotalCount()) ?? 0
}

async function queryByType(className: string) {
  results.value = ((await editor.value?.findObjects((obj) => obj.__class__ === className)) ?? []) as KritzelBaseObject<HTMLElement | SVGElement>[]
  totalCount.value = (await editor.value?.getObjectsTotalCount()) ?? 0
}

async function queryInViewport() {
  results.value = ((await editor.value?.getObjectsInViewport()) ?? []) as KritzelBaseObject<HTMLElement | SVGElement>[]
  totalCount.value = (await editor.value?.getObjectsTotalCount()) ?? 0
}

async function onReady() {
  if (!editor.value) {
    return
  }
  await seedEditor(editor.value)
  await queryAll()
}
</script>

<template>
  <div :style="hostStyle">
    <div :style="toolbarStyle">
      <button :style="buttonStyle(false)" @click="queryAll">Get All</button>
      <button :style="buttonStyle(false)" @click="queryByType('KritzelShape')">Filter Shapes</button>
      <button :style="buttonStyle(false)" @click="queryByType('KritzelPath')">Filter Paths</button>
      <button :style="buttonStyle(false)" @click="queryByType('KritzelLine')">Filter Lines</button>
      <button :style="buttonStyle(false)" @click="queryInViewport">In Viewport</button>
      <span :style="{ marginLeft: 'auto', fontSize: '13px' }">Total: {{ totalCount }}</span>
    </div>
    <div :style="{ display: 'flex', flex: 1, minHeight: 0 }">
      <KritzelEditor
        ref="editor"
        editorId="objects-query"
        theme="light"
        :themes="[vueThemeLight]"
        :isPanningEnabled="false"
        :isZoomingEnabled="false"
        :isMoreMenuVisible="false"
        :isWorkspaceManagerVisible="false"
        :style="editorStyle"
        @isReady="onReady"
      />
      <aside :style="{ width: '220px', borderLeft: '1px solid #ebebeb', padding: '8px', overflowY: 'auto', fontSize: '13px' }">
        <h3 :style="{ margin: '0 0 8px', fontSize: '14px' }">Results ({{ results.length }})</h3>
        <ul :style="{ listStyle: 'none', margin: 0, padding: 0 }">
          <li v-if="results.length === 0" :style="{ color: '#999', fontStyle: 'italic' }">No results</li>
          <li
            v-for="obj in results"
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
