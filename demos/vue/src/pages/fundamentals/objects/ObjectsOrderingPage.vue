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

function createOverlappingSeedObjects(): KritzelBaseObject[] {
  return createSeedObjects().map((object) => {
    object.translateX -= object.centerX
    object.translateY -= object.centerY
    return object
  })
}

const editor = getEditorRef('editor')
const seedObjects = createOverlappingSeedObjects()
const objects = ref<KritzelBaseObject[]>(seedObjects)
const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: seedObjects })]

async function refreshObjects() {
  const all = (await editor.value?.findObjects(
    (object) => object.__class__ !== 'KritzelSelectionBox',
  )) ?? []
  objects.value = [...all].sort(
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

</script>

<template>
  <div :style="hostStyle">
    <Toolbar>
      <button @click="selectAll">Select All</button>
      <button @click="bringToFront">Bring to Front</button>
      <button @click="bringForward">Bring Forward</button>
      <button @click="sendBackward">Send Backward</button>
      <button @click="sendToBack">Send to Back</button>
      <InfoPanelToggle :panel="infoPanel" />
    </Toolbar>
    <div :style="{ display: 'flex', flex: 1, minHeight: 0 }">
      <KritzelEditor
        ref="editor"
        editorId="objects-ordering"
        theme="light"
        :themes="themes"
        :workspaces="workspaces"
        :isPanningEnabled="false"
        :isZoomingEnabled="false"
        :isMoreMenuVisible="false"
        :isWorkspaceManagerVisible="false"
        :style="editorStyle"
        @objectsSelectionChange="refreshObjects"
      />
      <InfoPanel :panel="infoPanel" width="180px">
        <h3>Objects (z-order)</h3>
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
      </InfoPanel>
    </div>
  </div>
</template>
