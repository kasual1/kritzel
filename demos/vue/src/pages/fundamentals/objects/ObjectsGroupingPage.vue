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
const objects = ref<KritzelBaseObject[]>([])
const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]

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

async function groupSelected() {
  await editor.value?.group()
  await refreshObjects()
}

async function ungroupSelected() {
  await editor.value?.ungroup()
  await refreshObjects()
}

async function onReady() {
  await refreshObjects()
}
</script>

<template>
  <div :style="hostStyle">
    <Toolbar>
      <button @click="selectAll">Select All</button>
      <button @click="groupSelected">Group</button>
      <button @click="ungroupSelected">Ungroup</button>
      <InfoPanelToggle :panel="infoPanel" />
    </Toolbar>
    <div :style="{ display: 'flex', flex: 1, minHeight: 0 }">
      <KritzelEditor
        ref="editor"
        editorId="objects-grouping"
        theme="light"
        :themes="themes"
        :workspaces="workspaces"
        :isPanningEnabled="false"
        :isZoomingEnabled="false"
        :isMoreMenuVisible="false"
        :isWorkspaceManagerVisible="false"
        :style="editorStyle"
        @isReady="onReady"
        @objectsSelectionChange="refreshObjects"
      />
      <InfoPanel :panel="infoPanel" width="180px">
        <h3>Objects</h3>
        <ul :style="{ listStyle: 'none', margin: 0, padding: 0 }">
          <li
            v-for="obj in objects"
            :key="obj.id"
            :style="{ padding: '4px 0', borderBottom: '1px solid #eee' }"
          >
            {{ obj.__class__ }}
          </li>
        </ul>
      </InfoPanel>
    </div>
  </div>
</template>
