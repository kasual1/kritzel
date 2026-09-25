<script setup lang="ts">
import { onBeforeUnmount } from 'vue'
import {
  KritzelDynamicObject,
  KritzelEditor,
  KritzelWorkspace,
  registerVueDynamicObjectRenderer,
} from '@kritzel/vue-editor'
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
    tagName: 'kritzel-vue-calculator-widget',
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

function createCalculatorObject(): KritzelDynamicObject {
  const placeholder = document.createElement('div')
  placeholder.textContent = 'Loading Calculator...'
  const object = new KritzelDynamicObject({
    element: placeholder,
    rendererKey: CALCULATOR_RENDERER_KEY,
    rendererData: createCalculatorInitialState(),
    translateX: -130,
    translateY: -190,
    width: 260,
    height: 320,
  })
  object.isRotatable = false
  return object
}

const workspaces = [new KritzelWorkspace({ objects: [createCalculatorObject()] })]

onBeforeUnmount(() => {
  unregisterCalculatorRenderer()
})
</script>

<template>
  <KritzelEditor
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
