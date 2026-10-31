<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import {
  getEditorRef,
  KritzelEditor,
  KritzelWorkspace,
  type KritzelBaseObject,
  type KritzelObjectTitlebarActionEvent,
} from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createUiDocument, GenerativeUi, getUiTitle, isUi, objectConfig, objectTitlebar } from './generative-ui'
import type { Credentials } from './llm-providers'
import UiPreview from './UiPreview.vue'
import WelcomePanel from './WelcomePanel.vue'

const themes = [vueThemeLight, vueThemeDark]

/** The welcome guide takes its accent from the theme, like the editor's own controls. */
const accentStyle = {
  '--gen-ui-accent': vueThemeLight.global?.primaryColor,
  '--gen-ui-accent-hover': vueThemeLight.global?.primaryHoverColor,
}

const workspaces = [new KritzelWorkspace({ name: 'Generative UI', objects: [] })]

const editor = getEditorRef('editor')
let generator: GenerativeUi | null = null
let abort: AbortController | null = null

// The key only lives in this component's memory: it is gone when the page reloads.
const credentials = shallowRef<Credentials | null>(null)
const keyError = ref('')
const isWorking = ref(false)
const hasUis = ref(false)
const preview = shallowRef<{ title: string; document: string } | null>(null)

function onReady() {
  if (editor.value) {
    generator = new GenerativeUi(editor.value)
  }
}

async function generate(prompt: string) {
  if (!generator || abort || !prompt.trim()) {
    return
  }
  if (!credentials.value) {
    keyError.value = 'Add an API key to start generating UIs.'
    return
  }

  const controller = new AbortController()
  abort = controller
  isWorking.value = true
  try {
    await generator.generate(prompt, credentials.value, controller.signal)
  } catch (error) {
    if (!controller.signal.aborted) {
      const message = error instanceof Error ? error.message : String(error)
      await editor.value?.triggerNotification({ type: 'error', message })
    }
  } finally {
    abort = null
    isWorking.value = false
  }
}

function onChatSubmit(event: CustomEvent<string>) {
  void generate(event.detail)
}

function stop() {
  abort?.abort()
}

function connect(next: Credentials) {
  credentials.value = next
  keyError.value = ''
}

function onObjectsChange(event: CustomEvent<KritzelBaseObject[]>) {
  hasUis.value = event.detail.some(isUi)
}

async function onTitlebarAction(event: CustomEvent<KritzelObjectTitlebarActionEvent>) {
  const { elementId, objectId } = event.detail
  const ui = await editor.value?.getObjectById(objectId)
  if (elementId === 'play' && ui && isUi(ui) && !ui.isLoading) {
    preview.value = { title: getUiTitle(ui), document: createUiDocument(ui.content, getUiTitle(ui)) }
  }
}
</script>

<template>
  <div class="generative-ui" :style="accentStyle">
    <KritzelEditor
      ref="editor"
      class="generative-ui__editor"
      editorId="generative-ui"
      theme="light"
      :themes="themes"
      :workspaces="workspaces"
      :objectConfig="objectConfig"
      :objectTitlebar="objectTitlebar"
      :isChatBoxVisible="true"
      :isChatBoxLoading="isWorking"
      :isWorkspaceManagerVisible="false"
      @isReady="onReady"
      @chatSubmit="onChatSubmit"
      @chatStop="stop"
      @objectsChange="onObjectsChange"
      @objectTitlebarAction="onTitlebarAction"
    />
    <WelcomePanel
      :isVisible="!hasUis && !isWorking"
      :credentials="credentials"
      :error="keyError"
      @connect="connect"
      @disconnect="credentials = null"
      @example="generate"
    />
    <UiPreview v-if="preview" :title="preview.title" :document="preview.document" @close="preview = null" />
  </div>
</template>

<style scoped>
/* --gen-ui-accent and --gen-ui-accent-hover come from the theme, see accentStyle. */
.generative-ui {
  position: relative;
  height: 100%;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    sans-serif;
  /* UIs resize from their corners like frames in a design tool, without the corner squares. */
  --kritzel-selection-resize-handle-visibility: hidden;
}

.generative-ui__editor {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
