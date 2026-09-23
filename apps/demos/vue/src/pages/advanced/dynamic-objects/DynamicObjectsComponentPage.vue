<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import {
  getEditorRef,
  KritzelDynamicObject,
  KritzelEditor,
  registerVueDynamicObjectRenderer,
  type HTMLKritzelEditorElement,
} from '@kritzel/vue-editor'
import { vueThemeLight } from '../../../const/vue-theme-light'
import CounterWidget from './CounterWidget.ce.vue'

type CounterWidgetState = {
  count: number
}

function createCounterWidgetInitialState(): CounterWidgetState {
  return { count: 0 }
}

const COUNTER_RENDERER_KEY = 'vue-dynamic-object-counter'

const editor = getEditorRef('editor')
const hasAddedInitialDynamicObject = ref(false)
const unregisterCounterRenderer = registerVueDynamicObjectRenderer(COUNTER_RENDERER_KEY, {
  tagName: '@kritzel/vue-editor-counter-widget',
  component: CounterWidget,
  createInitialState: createCounterWidgetInitialState,
})

onBeforeUnmount(() => {
  unregisterCounterRenderer()
})

async function onReady() {
  const editorValue = editor.value as HTMLKritzelEditorElement | undefined
  if (!editorValue || hasAddedInitialDynamicObject.value) {
    return
  }

  const objectCount = await editorValue.getObjectsTotalCount()
  if (objectCount > 0) {
    return
  }

  hasAddedInitialDynamicObject.value = true

  const placeholder = document.createElement('div')
  placeholder.textContent = 'Loading Counter...'

  const dynamicObject = new KritzelDynamicObject({
    element: placeholder,
    rendererKey: COUNTER_RENDERER_KEY,
    rendererData: createCounterWidgetInitialState(),
    translateX: -150,
    translateY: -90,
    width: 260,
    height: 160,
  })

  dynamicObject.isRotatable = false

  await editorValue.addObject(dynamicObject)
}
</script>

<template>
  <div class="page">
    <div class="toolbar">
      <strong>Registered Component:</strong>
      <span>The object mounts a real Vue component via the renderer registry.</span>
    </div>
    <KritzelEditor
      ref="editor"
      editorId="dynamic-objects-component"
      theme="light"
      :themes="[vueThemeLight]"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      @isReady="onReady"
    />
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; height: 100vh; }
.toolbar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #ebebeb; font: 13px sans-serif; }
.toolbar strong { color: #42b883; }
KritzelEditor { flex: 1; min-height: 0; }
</style>
