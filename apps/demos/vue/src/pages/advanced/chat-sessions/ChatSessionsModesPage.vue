<script setup lang="ts">
import {
  UpdrawAgent,
  UpdrawChatSession,
  UpdrawEditor,
  UpdrawWorkspace,
  type UpdrawBaseObject,
  type UpdrawChatBoxChip,
  type UpdrawChatMessage,
} from '@updraw/vue-editor'
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import { editorStyle, hostStyle } from '../../shared/demo-shared'
import Toolbar from '../../../components/Toolbar.vue'
import { createDemoTransport, SLOW_PHRASE } from './chat-session-script'

type Mode = 'user' | 'agent'

const USER = { id: 'demo-user', name: 'Demo User' }
const SYSTEM = 'You draw on a whiteboard. Keep answers short.'

const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new UpdrawWorkspace({ objects: createSeedObjects() })]

// One session per mode, created once per page instance: switching the mode binds the other one.
// Kept as plain consts so Vue never wraps them in reactive proxies.
const transport = createDemoTransport()
const agent = new UpdrawAgent({ id: 'assistant', name: 'Assistant', color: '#7C3AED' })
const sessions: Record<Mode, UpdrawChatSession> = {
  user: new UpdrawChatSession({ transport, system: SYSTEM }),
  agent: new UpdrawChatSession({ transport, system: SYSTEM, agent }),
}

const mode = ref<Mode>('user')
const chips = ref<UpdrawChatBoxChip[]>([])
const messages = shallowRef<readonly UpdrawChatMessage[]>([])
const session = computed(() => sessions[mode.value])

const transcriptStyle = {
  width: '260px',
  margin: 0,
  padding: '8px 8px 8px 28px',
  overflow: 'auto',
  fontSize: '13px',
  borderLeft: '1px solid #e5e7eb',
}

/** One line of the transcript: who wrote it and what. */
function describe(message: UpdrawChatMessage): string {
  return message.parts
    .map(part => {
      if (part.type === 'text') return part.text
      if (part.type === 'tool-call') return `→ ${part.name}`
      if (part.type === 'tool-result') return `← ${part.name}${part.isError ? ' (failed)' : ''}`
      return `[${part.type}]`
    })
    .join(' ')
}

let unsubscribe: (() => void) | null = null

watch(
  session,
  current => {
    unsubscribe?.()
    messages.value = current.messages
    unsubscribe = current.on('change', () => {
      messages.value = current.messages
    })
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  unsubscribe?.()
  unsubscribe = null
})

function onSelectionChange(event: CustomEvent<UpdrawBaseObject[]>) {
  chips.value = event.detail.map(object => ({
    id: object.id,
    objectId: object.id,
    label: object.name || object.__class__.replace('Updraw', ''),
    icon: 'cursor',
  }))
}

function onChipRemove(event: CustomEvent<UpdrawChatBoxChip>) {
  chips.value = chips.value.filter(chip => chip.id !== event.detail.id)
}
</script>

<template>
  <div :style="hostStyle">
    <Toolbar>
      <span class="label">Chat Sessions</span>
      <button :aria-pressed="mode === 'user'" :disabled="mode === 'user'" @click="mode = 'user'">
        Work as User
      </button>
      <button :aria-pressed="mode === 'agent'" :disabled="mode === 'agent'" @click="mode = 'agent'">
        Work as Agent
      </button>
      <span class="label">Try “{{ SLOW_PHRASE }}” to stop a response.</span>
    </Toolbar>
    <div style="display: flex; flex: 1; min-height: 0">
      <UpdrawEditor
        editorId="chat-sessions-modes"
        theme="light"
        :themes="themes"
        :workspaces="workspaces"
        :user="USER"
        :isChatBoxVisible="true"
        :chatSession="session"
        :chatBoxChips="chips"
        :isMoreMenuVisible="false"
        :isWorkspaceManagerVisible="false"
        :style="{ ...editorStyle, minWidth: 0 }"
        @objectsSelectionChange="onSelectionChange"
        @chatChipRemove="onChipRemove"
      />
      <ol class="chat-transcript" aria-label="Transcript" :style="transcriptStyle">
        <li v-for="(message, index) in messages" :key="index" :data-role="message.role">
          <strong>{{ message.role }}:</strong> {{ describe(message) }}
        </li>
      </ol>
    </div>
  </div>
</template>
