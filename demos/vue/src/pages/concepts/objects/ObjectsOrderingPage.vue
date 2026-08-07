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

async function bringToFront() {
  await editor.value?.bringToFront()
  await refreshObjects()
}

async function bringForward() {
  await editor.value?.bringForward()
  await refreshObjects()
}

async function sendBackward() {
  await editor.value?.sendBackward()
  await refreshObjects()
}

async function sendToBack() {
  await editor.value?.sendToBack()
  await refreshObjects()
}

async function onReady() {
  if (!editor.value) {
    return
  }

  await seedEditor(editor.value)

  const all = (await editor.value.getAllObjects()) ?? []
  await Promise.all(
    all.map((obj) =>
      editor.value?.updateObject(obj, {
        translateX: obj.translateX - obj.centerX,
        translateY: obj.translateY - obj.centerY,
      }),
    ),
  )

  await refreshObjects()
}
</script>

<template>
  <div :style="hostStyle">
    <div :style="toolbarStyle">
      <button :style="buttonStyle(false)" @click="selectAll">Select All</button>
      <button :style="buttonStyle(false)" @click="bringToFront">Bring to Front</button>
      <button :style="buttonStyle(false)" @click="bringForward">Bring Forward</button>
      <button :style="buttonStyle(false)" @click="sendBackward">Send Backward</button>
      <button :style="buttonStyle(false)" @click="sendToBack">Send to Back</button>
    </div>
    <div :style="{ display: 'flex', flex: 1, minHeight: 0 }">
      <KritzelEditor
        ref="editor"
        editorId="objects-ordering"
        theme="vue-theme"
        :themes="[vueThemeLight]"
        :isPanningEnabled="false"
        :isZoomingEnabled="false"
        :isMoreMenuVisible="false"
        :isWorkspaceManagerVisible="false"
        :style="editorStyle"
        @isReady="onReady"
      />
      <aside :style="{ width: '200px', borderLeft: '1px solid #ebebeb', padding: '8px', overflowY: 'auto', fontSize: '13px' }">
        <h3 :style="{ margin: '0 0 8px', fontSize: '14px' }">Objects (z-order)</h3>
        <ul :style="{ listStyle: 'none', margin: 0, padding: 0 }">
          <li
            v-for="obj in objects"
            :key="obj.id"
            :style="{ padding: '4px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }"
          >
            <span>{{ obj.__class__ }}</span>
            <span :style="{ color: '#999', fontFamily: 'monospace' }">z:{{ obj.zIndex }}</span>
          </li>
        </ul>
      </aside>
    </div>
  </div>
</template>
