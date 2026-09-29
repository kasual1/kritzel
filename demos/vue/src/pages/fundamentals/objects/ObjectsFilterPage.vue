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
import { editorStyle, hostStyle } from '../../shared/demo-shared'
import Toolbar from '../../../components/Toolbar.vue'
import InfoPanel from '../../../components/InfoPanel.vue'
import InfoPanelToggle from '../../../components/InfoPanelToggle.vue'
import { useInfoPanel } from '../../../components/info-panel'

const infoPanel = useInfoPanel({ hasToolbarToggle: true })

const editor = getEditorRef('editor')
const results = ref<KritzelBaseObject[]>([])
const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]

async function highlightResults(nextResults: KritzelBaseObject[]) {
  if (!editor.value) {
    return
  }

  const all = await editor.value.getAllObjects()
  await Promise.all(all.map((object) => editor.value?.updateObject(object, { opacity: 0.5 })))
  await Promise.all(nextResults.map((object) => editor.value?.updateObject(object, { opacity: 1 })))
}

async function showResults(nextResults: KritzelBaseObject[]) {
  results.value = nextResults
  await highlightResults(nextResults)
}

async function queryAll() {
  await showResults((await editor.value?.getAllObjects()) ?? [])
}

async function queryNone() {
  await showResults([])
}

async function queryByType(className: string) {
  const filtered = (await editor.value?.findObjects((object) => object.__class__ === className)) ?? []
  await showResults(filtered)
}

async function queryInViewport() {
  await showResults((await editor.value?.getObjectsInViewport()) ?? [])
}

async function onReady() {
  await highlightResults([])
}
</script>

<template>
  <div :style="hostStyle">
    <Toolbar>
      <button @click="queryByType('KritzelShape')">Shapes</button>
      <button @click="queryByType('KritzelPath')">Paths</button>
      <button @click="queryByType('KritzelLine')">Lines</button>
      <button @click="queryAll">All</button>
      <button @click="queryNone">None</button>
      <button @click="queryInViewport">In Viewport</button>
      <InfoPanelToggle :panel="infoPanel" />
    </Toolbar>
    <div class="content">
      <KritzelEditor
        ref="editor"
        editorId="objects-filter"
        theme="light"
        :themes="themes"
        :workspaces="workspaces"
        :isPanningEnabled="false"
        :isZoomingEnabled="false"
        :isMoreMenuVisible="false"
        :isWorkspaceManagerVisible="false"
        :style="editorStyle"
        @isReady="onReady"
      />
      <InfoPanel :panel="infoPanel">
        <h3>Objects</h3>
        <ul>
          <li v-if="results.length === 0" class="empty">No results</li>
          <li v-for="object in results" v-else :key="object.id">
            <span class="type">{{ object.__class__ }}</span>
            <span class="id">{{ object.id.slice(0, 8) }}</span>
          </li>
        </ul>
      </InfoPanel>
    </div>
  </div>
</template>

<style scoped>
.content {
  display: flex;
  flex: 1;
  min-height: 0;
}

ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

li {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid #eee;
}

.type {
  color: #333;
  font-weight: 500;
}

.id {
  color: #999;
  font-family: monospace;
  font-size: 11px;
}

.empty {
  color: #999;
  font-style: italic;
}
</style>