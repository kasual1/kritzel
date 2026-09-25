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
const seedObjects = createSeedObjects()
const objects = ref<KritzelBaseObject[]>(seedObjects)
const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: seedObjects })]

async function removeLastObject() {
  const all = (await editor.value?.getAllObjects()) ?? []
  const lastObject = all.at(-1)
  if (!lastObject) {
    return
  }

  await editor.value?.removeObject(lastObject)
  objects.value = (await editor.value?.getAllObjects()) ?? []
}
</script>

<template>
  <div :style="hostStyle">
    <div :style="toolbarStyle">
      <button :style="buttonStyle()" :disabled="objects.length === 0" @click="removeLastObject">
        Remove Object
      </button>
    </div>
    <KritzelEditor
      ref="editor"
      editorId="objects-remove"
      theme="light"
      :themes="themes"
      :workspaces="workspaces"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
    />
  </div>
</template>