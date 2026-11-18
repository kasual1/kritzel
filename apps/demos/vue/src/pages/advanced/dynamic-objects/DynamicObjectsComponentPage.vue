<script setup lang="ts">
import { onBeforeUnmount } from 'vue'
import {
  UpmadeDynamicObject,
  UpmadeEditor,
  UpmadeWorkspace,
  registerVueDynamicObjectRenderer,
} from '@upmade/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import CalculatorWidget from './CalculatorWidget.ce.vue'
import {
  createCalculatorInitialState,
  normalizeCalculatorState,
  type CalculatorState,
} from './calculator-state'

const CALCULATOR_RENDERER_KEY = 'vue-dynamic-object-calculator'
const themes = [vueThemeLight, vueThemeDark]
const unregisterCalculatorRenderer = registerVueDynamicObjectRenderer<CalculatorState>(
  CALCULATOR_RENDERER_KEY,
  {
    tagName: 'upmade-vue-calculator-widget',
    component: CalculatorWidget,
    createInitialState: createCalculatorInitialState,
    getInitialState: (data) => normalizeCalculatorState(data),
    normalizeState: (state) => normalizeCalculatorState(state),
    mapProps: (state, context) => ({
      initialState: normalizeCalculatorState(state),
      onStateChange: (nextState: unknown) => {
        context.object.rendererData = normalizeCalculatorState(nextState)
      },
    }),
  },
)

function createCalculatorObject(): UpmadeDynamicObject {
  const placeholder = document.createElement('div')
  placeholder.textContent = 'Loading Calculator...'
  const object = new UpmadeDynamicObject({
    element: placeholder,
    rendererKey: CALCULATOR_RENDERER_KEY,
    rendererData: createCalculatorInitialState(),
    translateX: -130,
    translateY: -190,
    width: 260,
    height: 320,
    borderRadius: 12,
  })
  object.isRotatable = false
  return object
}

const workspaces = [new UpmadeWorkspace({ objects: [createCalculatorObject()] })]

onBeforeUnmount(() => {
  unregisterCalculatorRenderer()
})
</script>

<template>
  <UpmadeEditor
    editorId="dynamic-objects-component"
    theme="light"
    :themes="themes"
    :workspaces="workspaces"
    :isPanningEnabled="false"
    :isZoomingEnabled="false"
    :isMoreMenuVisible="false"
    :isWorkspaceManagerVisible="false"
    style="display: block; width: 100%; height: 100vh"
  />
</template>
