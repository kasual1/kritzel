<script setup lang="ts">
import { computed, ref } from 'vue'
import { detectProvider, getProvider, PROVIDERS, type Credentials, type ProviderId } from './llm-providers'

const EXAMPLE_PROMPTS = [
  'A pomodoro timer with a circular progress ring',
  'A weather card for Lisbon with a 5-day forecast',
  'A kanban board for a product launch, with drag and drop',
]

const props = defineProps<{
  isVisible: boolean
  credentials: Credentials | null
  error: string
}>()

const emit = defineEmits<{
  connect: [credentials: Credentials]
  disconnect: []
  example: [prompt: string]
}>()

const providerId = ref<ProviderId>('anthropic')
const apiKey = ref('')
const provider = computed(() => getProvider(props.credentials?.provider ?? providerId.value))

function updateKey(value: string) {
  apiKey.value = value
  const detected = detectProvider(value)
  if (detected) {
    providerId.value = detected
  }
}

function connect() {
  if (apiKey.value.trim()) {
    emit('connect', { provider: providerId.value, apiKey: apiKey.value.trim() })
    apiKey.value = ''
  }
}
</script>

<!-- The empty-canvas guide, centered on the canvas until the first UI is added. It also takes the API key. -->
<template>
  <div class="welcome" :class="{ 'welcome--hidden': !isVisible }" :aria-hidden="!isVisible">
    <div class="welcome__content">
      <p class="welcome__eyebrow">Generative UI</p>
      <h1 class="welcome__title">Describe an interface.<br />Watch it come to life.</h1>
      <p class="welcome__hint">
        {{
          credentials
            ? 'Type into the chat box below. The model builds a working UI on the canvas while you watch. Select a UI to change it.'
            : 'Add your Anthropic, OpenAI or Gemini API key, then type into the chat box below.'
        }}
      </p>

      <div v-if="credentials" class="welcome__connected">
        <span>Connected to {{ provider.name }} · {{ provider.model }}</span>
        <button type="button" class="welcome__change" @click="emit('disconnect')">Change key</button>
      </div>
      <form v-else @submit.prevent="connect">
        <label class="welcome__label" for="generative-ui-key">API key</label>
        <div class="welcome__providers" role="group" aria-label="Provider">
          <button
            v-for="option in PROVIDERS"
            :key="option.id"
            type="button"
            class="welcome__provider"
            :aria-pressed="option.id === providerId"
            @click="providerId = option.id"
          >
            {{ option.name }}
          </button>
        </div>
        <div class="welcome__key-row">
          <input
            id="generative-ui-key"
            class="welcome__key"
            type="password"
            :placeholder="provider.keyPlaceholder"
            autocomplete="off"
            spellcheck="false"
            :value="apiKey"
            @input="updateKey(($event.target as HTMLInputElement).value)"
          />
          <button type="submit" class="welcome__connect">Connect</button>
        </div>
        <p class="welcome__note">
          Kept in this tab's memory only and sent straight to {{ provider.name }}.
          <a :href="provider.keyUrl" target="_blank" rel="noreferrer">Get a key</a>
        </p>
      </form>
      <p v-if="error" class="welcome__error" role="alert">{{ error }}</p>

      <ul class="welcome__examples" aria-label="Example prompts">
        <li v-for="prompt in EXAMPLE_PROMPTS" :key="prompt">
          <button type="button" class="welcome__example" @click="emit('example', prompt)">“{{ prompt }}”</button>
        </li>
      </ul>
      <p class="welcome__footer">Press <kbd>▶</kbd> in a titlebar to open a UI in fullscreen.</p>
    </div>
  </div>
</template>

<style scoped>
/* Centered on the empty canvas. Clicks and wheel events go through to the canvas, except on the controls. */
.welcome {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  overflow: auto;
  pointer-events: none;
  transition:
    opacity 240ms ease-out,
    transform 240ms ease-out;
}

/* Hidden only after the fade, which also takes the guide out of the tab order. */
.welcome--hidden {
  visibility: hidden;
  opacity: 0;
  transform: scale(0.98);
  transition:
    opacity 240ms ease-out,
    transform 240ms ease-out,
    visibility 0s 240ms;
}

.welcome__content {
  max-width: 640px;
  padding: 24px 24px 96px;
  color: #18181b;
}

.welcome__content form,
.welcome__connected,
.welcome__example {
  pointer-events: auto;
}

.welcome__eyebrow {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gen-ui-accent);
}

.welcome__title {
  margin: 12px 0 20px;
  font-size: 52px;
  line-height: 1.05;
  letter-spacing: -0.03em;
}

.welcome__hint {
  margin: 0 0 24px;
  font-size: 18px;
  line-height: 1.5;
  color: #52525b;
}

.welcome__label {
  display: block;
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: #3f3f46;
}

.welcome__providers {
  display: inline-flex;
  gap: 2px;
  margin-bottom: 10px;
  padding: 3px;
  border-radius: 10px;
  background: #f4f4f5;
}

.welcome__provider {
  height: 30px;
  padding: 0 12px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  color: #52525b;
  cursor: pointer;
}

.welcome__provider[aria-pressed='true'] {
  background: #ffffff;
  color: #18181b;
  box-shadow: 0 1px 2px rgba(20, 18, 31, 0.12);
}

.welcome__key-row {
  display: flex;
  gap: 8px;
}

.welcome__key {
  flex: 1;
  min-width: 0;
  height: 44px;
  padding: 0 14px;
  border: 1px solid #e4e4e7;
  border-radius: 12px;
  background: #ffffff;
  font: inherit;
  font-size: 16px;
  color: #18181b;
}

.welcome__key:focus {
  border-color: var(--gen-ui-accent);
  outline: 2px solid color-mix(in srgb, var(--gen-ui-accent) 25%, transparent);
}

.welcome__connect {
  height: 44px;
  padding: 0 18px;
  border: 0;
  border-radius: 12px;
  background: var(--gen-ui-accent);
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  cursor: pointer;
}

.welcome__connect:hover {
  background: var(--gen-ui-accent-hover);
}

.welcome__note {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: #71717a;
}

.welcome__note a,
.welcome__change {
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: var(--gen-ui-accent);
  cursor: pointer;
}

.welcome__error {
  margin: 8px 0 0;
  font-size: 14px;
  color: #b91c1c;
}

.welcome__connected {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 12px;
  background: #f4f4f5;
  font-size: 16px;
  color: #3f3f46;
}

.welcome__connected::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
}

.welcome__connected .welcome__change {
  margin-left: auto;
}

.welcome__examples {
  display: grid;
  gap: 10px;
  margin: 24px 0 0;
  padding: 0;
  list-style: none;
}

.welcome__example {
  width: 100%;
  padding: 12px 16px;
  border: 0;
  border-radius: 12px;
  background: #f4f4f5;
  font: inherit;
  font-size: 16px;
  text-align: left;
  color: #3f3f46;
  cursor: pointer;
}

.welcome__example:hover {
  background: #e4e4e7;
}

.welcome__footer {
  margin: 24px 0 0;
  font-size: 15px;
  line-height: 1.5;
  color: #52525b;
}

.welcome__footer kbd {
  padding: 2px 6px;
  border-radius: 6px;
  background: #e4e4e7;
  font: inherit;
  font-size: 0.9em;
}
</style>
