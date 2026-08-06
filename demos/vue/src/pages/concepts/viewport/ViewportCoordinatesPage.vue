<script setup lang="ts">

import { KritzelEditor } from 'kritzel-vue'
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
const worldCoords = ref<{ x: number; y: number } | null>(null)
const screenCoords = ref<{ x: number; y: number } | null>(null)
const screenX = ref(200)
const screenY = ref(150)
const worldX = ref(0)
const worldY = ref(0)

async function convertScreenToWorld() {
  worldCoords.value = (await editor.value?.screenToWorld(screenX.value, screenY.value)) ?? null
}

async function convertWorldToScreen() {
  screenCoords.value = (await editor.value?.worldToScreen(worldX.value, worldY.value)) ?? null
}

async function onReady() {
  if (editor.value) {
    await seedEditor(editor.value)
  }
}
</script>

<template>
  <div :style="hostStyle">
    <div :style="toolbarStyle">
      <span :style="{ fontSize: '13px', fontWeight: 500 }">Screen -&gt; World</span>
      <input v-model.number="screenX" type="number" :style="{ width: '80px' }" />
      <input v-model.number="screenY" type="number" :style="{ width: '80px' }" />
      <button :style="buttonStyle(false)" @click="convertScreenToWorld">Convert</button>
      <span :style="{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: '13px' }">
        {{ worldCoords ? `World: (${worldCoords.x.toFixed(1)}, ${worldCoords.y.toFixed(1)})` : '' }}
      </span>
    </div>
    <div :style="toolbarStyle">
      <span :style="{ fontSize: '13px', fontWeight: 500 }">World -&gt; Screen</span>
      <input v-model.number="worldX" type="number" :style="{ width: '80px' }" />
      <input v-model.number="worldY" type="number" :style="{ width: '80px' }" />
      <button :style="buttonStyle(false)" @click="convertWorldToScreen">Convert</button>
      <span :style="{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: '13px' }">
        {{ screenCoords ? `Screen: (${screenCoords.x.toFixed(1)}, ${screenCoords.y.toFixed(1)})` : '' }}
      </span>
    </div>
    <KritzelEditor
      ref="editor"
      editorId="viewport-coordinates"
      theme="vue-theme"
      :themes="[vueThemeLight]"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
      @isReady="onReady"
    />
  </div>
</template>
