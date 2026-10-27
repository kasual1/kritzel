<script setup lang="ts">
import {
  KRITZEL_DEFAULT_OBJECT_TITLEBAR,
  KritzelEditor,
  KritzelWorkspace,
  type KritzelObjectConfig,
} from '@kritzel/vue-editor'
import { computed, ref } from 'vue'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import { editorStyle, hostStyle, toolbarStyle } from '../../shared/demo-shared'

const areShapesRotatable = ref(false)
const areShapesResizable = ref(false)
const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]

// A new object on every change, so that the editor rerenders with the new rules.
const objectConfig = computed<KritzelObjectConfig>(() => {
  const isRotatable = areShapesRotatable.value
  const isResizable = areShapesResizable.value

  return {
    hasTitlebar: object => object.__class__ === 'KritzelShape',
    isRotatable: object => isRotatable || object.__class__ !== 'KritzelShape',
    isResizable: object => isResizable || object.__class__ !== 'KritzelShape',
  }
})

function setShapesRotatable(event: Event) {
  areShapesRotatable.value = (event.target as HTMLInputElement).checked
}

function setShapesResizable(event: Event) {
  areShapesResizable.value = (event.target as HTMLInputElement).checked
}
</script>

<template>
  <div :style="hostStyle">
    <div :style="toolbarStyle">
      <label class="checkbox-control">
        <input type="checkbox" :checked="areShapesRotatable" @change="setShapesRotatable" />
        <span>Rotate shapes</span>
      </label>
      <label class="checkbox-control">
        <input type="checkbox" :checked="areShapesResizable" @change="setShapesResizable" />
        <span>Resize shapes</span>
      </label>
    </div>
    <KritzelEditor
      editorId="objects-configuration"
      theme="light"
      :themes="themes"
      :workspaces="workspaces"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :objectTitlebar="KRITZEL_DEFAULT_OBJECT_TITLEBAR"
      :objectConfig="objectConfig"
      :style="editorStyle"
    />
  </div>
</template>

<style scoped>
.checkbox-control {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #333;
  font-size: 13px;
  cursor: pointer;
}
</style>
