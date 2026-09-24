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
    <div :style="toolbarStyle">
      <button :style="buttonStyle(false)" @click="selectAll">Select All</button>
      <button :style="buttonStyle(false)" @click="groupSelected">Group</button>
      <button :style="buttonStyle(false)" @click="ungroupSelected">Ungroup</button>
    </div>
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
