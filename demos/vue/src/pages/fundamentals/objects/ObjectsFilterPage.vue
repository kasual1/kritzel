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
import { buttonStyle, editorStyle, hostStyle, toolbarStyle } from '../../shared/demo-shared'

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
    <div :style="toolbarStyle">
      <button :style="buttonStyle()" @click="queryByType('KritzelShape')">Shapes</button>
      <button :style="buttonStyle()" @click="queryByType('KritzelPath')">Paths</button>
      <button :style="buttonStyle()" @click="queryByType('KritzelLine')">Lines</button>
      <button :style="buttonStyle()" @click="queryAll">All</button>
      <button :style="buttonStyle()" @click="queryNone">None</button>
      <button :style="buttonStyle()" @click="queryInViewport">In Viewport</button>
    </div>
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
      <aside class="info-panel">
        <h3>Objects</h3>
        <ul>
          <li v-if="results.length === 0" class="empty">No results</li>
          <li v-for="object in results" v-else :key="object.id">
            <span class="type">{{ object.__class__ }}</span>
            <span class="id">{{ object.id.slice(0, 8) }}</span>
          </li>
        </ul>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.content {
  display: flex;
  flex: 1;
  min-height: 0;
}

.info-panel {
  width: 220px;
  padding: 8px;
  overflow-y: auto;
  border-left: 1px solid #ebebeb;
  font-size: 13px;
}

h3 {
  margin: 0 0 8px;
  font-size: 14px;
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