<script setup lang="ts">
import {
  getEditorRef,
  UpmadeEditor,
  UpmadeWorkspace,
  type UpmadeBaseObject,
} from '@upmade/vue-editor'
import { ref } from 'vue'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import { editorStyle, hostStyle } from '../../shared/demo-shared'
import Toolbar from '../../../components/Toolbar.vue'

const editor = getEditorRef('editor')
const seedObjects = createSeedObjects()
const objects = ref<UpmadeBaseObject[]>(seedObjects)
const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new UpmadeWorkspace({ objects: seedObjects })]

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
    <Toolbar>
      <button :disabled="objects.length === 0" @click="removeLastObject">
        Remove Object
      </button>
    </Toolbar>
    <UpmadeEditor
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