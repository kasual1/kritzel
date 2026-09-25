<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { KritzelEditor, KritzelIframeObject, KritzelWorkspace } from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { mockChatPrompts, mockComponentDefinitions } from './iframe-calculator-definitions'

function createRuntimeObject(): KritzelIframeObject {
  const definition = mockComponentDefinitions[0]
  const object = new KritzelIframeObject({
    content: definition.content,
    loadingContent: definition.loadingContent,
    state: definition.initialState,
    title: definition.name,
    translateX: -140,
    translateY: -200,
    width: 280,
    height: 320,
    borderRadius: 12,
    boxShadow: '0 12px 32px rgba(32, 33, 36, 0.12)',
  })
  object.isRotatable = false
  return object
}

const runtimeObject = createRuntimeObject()
const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: [runtimeObject] })]
const promptIndex = ref(0)
const promptText = ref(mockChatPrompts[0])
const queryLabel = computed(() => `${promptIndex.value + 1} of ${mockChatPrompts.length}`)
let responseTimeout: ReturnType<typeof setTimeout> | undefined

function showPrompt(offset: -1 | 1): void {
  const nextIndex = Math.max(0, Math.min(promptIndex.value + offset, mockChatPrompts.length - 1))
  if (nextIndex === promptIndex.value) {
    return
  }

  if (responseTimeout) {
    clearTimeout(responseTimeout)
  }
  promptIndex.value = nextIndex
  promptText.value = mockChatPrompts[nextIndex]
  const definition = mockComponentDefinitions[nextIndex]
  runtimeObject.setLoadingContent(definition.loadingContent)
  runtimeObject.setContent(definition.loadingContent)
  runtimeObject.setLoading(true)
  responseTimeout = setTimeout(() => {
    runtimeObject.setState(definition.initialState)
    runtimeObject.setContent(definition.content)
    runtimeObject.setLoading(false)
    responseTimeout = undefined
  }, 1100)
}

onBeforeUnmount(() => {
  if (responseTimeout) {
    clearTimeout(responseTimeout)
  }
})
</script>

<template>
  <div class="page">
    <KritzelEditor
      editorId="dynamic-objects-iframe"
      theme="light"
      :themes="themes"
      :workspaces="workspaces"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isToolbarVisible="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
    />
    <div class="chat-input">
      <textarea v-model="promptText" rows="3" aria-label="Mock LLM prompt"></textarea>
      <div class="query-nav" aria-label="Mock prompt navigation">
        <button type="button" aria-label="Previous query" :disabled="promptIndex === 0" @click="showPrompt(-1)">&lt;</button>
        <span>{{ queryLabel }}</span>
        <button type="button" aria-label="Next query" :disabled="promptIndex === mockChatPrompts.length - 1" @click="showPrompt(1)">&gt;</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { position: relative; height: 100vh; }
.page > :first-child { display: block; width: 100%; height: 100%; }
.chat-input { position: absolute; left: 50%; bottom: 18px; z-index: 20; width: min(460px, calc(100% - 32px)); padding: 10px; border: 1px solid #e5e7eb; border-radius: 16px; background: #ffffff; box-shadow: 0 16px 42px rgba(32, 33, 36, 0.18); box-sizing: border-box; transform: translateX(-50%); font-family: Roboto, sans-serif; }
textarea { display: block; width: 100%; height: 98px; resize: none; border: 0; border-radius: 12px; padding: 12px 14px 38px; box-sizing: border-box; background: #f3f4f6; font: inherit; line-height: 1.45; }
.query-nav { position: absolute; right: 18px; bottom: 18px; display: flex; align-items: center; gap: 6px; color: #5f6368; font-size: 12px; font-weight: 700; }
.query-nav button { width: 26px; height: 26px; border: 0; border-radius: 50%; padding: 0; background: #ffffff; cursor: pointer; font-size: 18px; }
.query-nav button:disabled { color: #b8bdc4; cursor: default; opacity: 0.55; }
</style>