<script setup lang="ts">
import { onBeforeUnmount } from 'vue'
import {
  KritzelDynamicObjectRendererRegistry,
  KritzelEditor,
  KritzelWorkspace,
} from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import {
  createHtmlCalculator,
  createHtmlCalculatorObject,
  HTML_CALCULATOR_RENDERER_KEY,
  type HtmlCalculatorInstance,
} from './html-calculator'
import { normalizeCalculatorState } from './calculator-state'

const mountedCalculators = new Map<string, HtmlCalculatorInstance>()
const themes = [vueThemeLight, vueThemeDark]

function destroyCalculator(objectId: string, container: HTMLElement | null): void {
  mountedCalculators.get(objectId)?.destroy()
  mountedCalculators.delete(objectId)
  if (container) {
    container.innerHTML = ''
  }
}

KritzelDynamicObjectRendererRegistry.register(HTML_CALCULATOR_RENDERER_KEY, {
  onMount: ({ object, container, data }) => {
    if (!container) {
      return
    }
    destroyCalculator(object.id, container)
    const calculator = createHtmlCalculator(normalizeCalculatorState(data))
    mountedCalculators.set(object.id, calculator)
    container.style.overflow = 'visible'
    container.appendChild(calculator.element)
  },
  onSerialize: ({ object, data }) =>
    mountedCalculators.get(object.id)?.getState() ?? normalizeCalculatorState(data),
  onUnmount: ({ object, container, data }) => {
    const state = mountedCalculators.get(object.id)?.getState() ?? normalizeCalculatorState(data)
    destroyCalculator(object.id, container)
    return state
  },
})

const workspaces = [new KritzelWorkspace({ objects: [createHtmlCalculatorObject()] })]

onBeforeUnmount(() => {
  mountedCalculators.forEach((calculator) => calculator.destroy())
  mountedCalculators.clear()
  KritzelDynamicObjectRendererRegistry.unregister(HTML_CALCULATOR_RENDERER_KEY)
})
</script>

<template>
  <KritzelEditor
    editorId="dynamic-objects-html"
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
