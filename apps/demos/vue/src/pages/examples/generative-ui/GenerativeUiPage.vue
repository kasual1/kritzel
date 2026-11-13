<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import {
  getEditorRef,
  UpdrawEditor,
  UpdrawWorkspace,
  type UpdrawBaseObject,
  type UpdrawChatBoxChip,
  type UpdrawChatSession,
  type UpdrawObjectTitlebarActionEvent,
} from '@updraw/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createBrowserTransport, type Credentials } from './browser-transport'
import {
  createGenerativeUiSession,
  createUiDocument,
  getErrorMessage,
  getUiChips,
  getUiTitle,
  isUi,
  objectConfig,
  objectTitlebar,
  withUiFrames,
  type RequestMode,
} from './generative-ui'
import { createMockTransport } from './mock-transport'
import UiPreview from './UiPreview.vue'
import WelcomePanel from './WelcomePanel.vue'

const themes = [withUiFrames(vueThemeLight), withUiFrames(vueThemeDark)]

/** The welcome guide takes its accent from the theme, like the editor's own controls. */
const accentStyle = {
  '--gen-ui-accent': vueThemeLight.global?.primaryColor,
  '--gen-ui-accent-hover': vueThemeLight.global?.primaryHoverColor,
}

const workspaces = [new UpdrawWorkspace({ name: 'Generative UI', objects: [] })]

// One session per mode, created once per page instance: choosing a mode binds its session to the editor.
// Kept as plain consts so Vue never wraps them in reactive proxies.
const browser = createBrowserTransport()
const sessions: Record<RequestMode, UpdrawChatSession> = {
  live: createGenerativeUiSession(browser.transport),
  mock: createGenerativeUiSession(createMockTransport()),
}

const editor = getEditorRef('editor')
const mode = ref<RequestMode | null>(null)
// The key only lives in this component's memory: it is gone when the page reloads.
const credentials = shallowRef<Credentials | null>(null)
const keyError = ref('')
const isWorking = ref(false)
const hasUis = ref(false)
const chips = ref<UpdrawChatBoxChip[]>([])
const preview = shallowRef<{ title: string; document: string } | null>(null)
const session = computed(() => (mode.value ? sessions[mode.value] : null))

// Mirrors whether the bound session runs. The chat box shows the progress of a prompt, but not why it failed.
watch(
  session,
  (current, _previous, onCleanup) => {
    isWorking.value = current?.running ?? false
    if (!current) {
      return
    }
    const unsubscribers = [
      current.on('change', () => {
        isWorking.value = current.running
      }),
      current.on('end', result => {
        if (result.status === 'error') {
          void editor.value?.triggerNotification({ type: 'error', message: getErrorMessage(result.error) })
        }
      }),
    ]
    onCleanup(() => unsubscribers.forEach(unsubscribe => unsubscribe()))
  },
  { immediate: true },
)

function sendExample(prompt: string) {
  if (mode.value === 'live' && !credentials.value) {
    keyError.value = 'Add an API key to start generating UIs.'
    return
  }
  void session.value?.send(prompt)
}

function connect(next: Credentials) {
  browser.setCredentials(next)
  credentials.value = next
  keyError.value = ''
}

function disconnect() {
  browser.setCredentials(null)
  credentials.value = null
}

function changeMode(next: RequestMode | null) {
  mode.value = next
  keyError.value = ''
}

function onObjectsChange(event: CustomEvent<UpdrawBaseObject[]>) {
  hasUis.value = event.detail.some(isUi)
}

function onSelectionChange(event: CustomEvent<UpdrawBaseObject[]>) {
  chips.value = getUiChips(event.detail)
}

function onChipRemove(event: CustomEvent<UpdrawChatBoxChip>) {
  chips.value = chips.value.filter(chip => chip.id !== event.detail.id)
}

async function onTitlebarAction(event: CustomEvent<UpdrawObjectTitlebarActionEvent>) {
  const { elementId, objectId } = event.detail
  const ui = await editor.value?.getObjectById(objectId)
  if (elementId === 'play' && ui && isUi(ui) && !ui.isLoading) {
    preview.value = { title: getUiTitle(ui), document: createUiDocument(ui.content, getUiTitle(ui)) }
  }
}
</script>

<template>
  <div class="generative-ui" :style="accentStyle">
    <UpdrawEditor
      ref="editor"
      class="generative-ui__editor"
      editorId="generative-ui"
      theme="light"
      :themes="themes"
      :workspaces="workspaces"
      :objectConfig="objectConfig"
      :objectTitlebar="objectTitlebar"
      :chatSession="session"
      :chatBoxChips="chips"
      :isChatBoxVisible="mode === 'mock' || credentials !== null"
      :isToolbarVisible="false"
      :isWorkspaceManagerVisible="false"
      @objectsChange="onObjectsChange"
      @objectsSelectionChange="onSelectionChange"
      @chatChipRemove="onChipRemove"
      @objectTitlebarAction="onTitlebarAction"
    />
    <WelcomePanel
      :isVisible="!hasUis && !isWorking"
      :mode="mode"
      :credentials="credentials"
      :error="keyError"
      @modeChange="changeMode"
      @connect="connect"
      @disconnect="disconnect"
      @example="sendExample"
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
  --updraw-selection-resize-handle-visibility: hidden;
}

.generative-ui__editor {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
