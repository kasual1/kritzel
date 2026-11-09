<script setup lang="ts">
import { ref } from 'vue'
import {
  getEditorRef,
  KritzelAgent,
  KritzelEditor,
  KritzelIframeObject,
  KritzelWorkspace,
  type KritzelObjectElementClickEvent,
  type KritzelObjectElementHoverEvent,
  type KritzelObjectElementInfo,
  type KritzelObjectElementPickEvent,
} from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { iframeElementsContent } from './iframe-elements-content'

const AGENT = 'agent'
const EMPTY = '—'
// The panel is docked to the bottom-left corner and the card sits above it, so they don't overlap even in the
// 560px high docs embed. The agent starts just right of the card's top edge.
const CARD_TOP = -250
const AGENT_START = { x: 170, y: CARD_TOP + 10 }

function createPlanObject(): KritzelIframeObject {
  const object = new KritzelIframeObject({
    name: 'Team plan',
    title: 'Team plan',
    content: iframeElementsContent,
    translateX: -150,
    translateY: CARD_TOP,
    width: 300,
    height: 290,
    borderRadius: 12,
    boxShadow: '0 12px 32px rgba(32, 33, 36, 0.12)',
  })
  object.isRotatable = false
  return object
}

function describe(element: KritzelObjectElementInfo): string {
  const name = element.kritzelId ?? element.tagName
  if (!element.text) {
    return name
  }
  const text = element.text.length > 24 ? `${element.text.slice(0, 23)}…` : element.text
  return `${name} "${text}"`
}

const planObject = createPlanObject()
const agent = new KritzelAgent({ id: AGENT, name: 'Agent', status: 'Pick an element', position: AGENT_START })
const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: [planObject] })]
const editor = getEditorRef('editor')
const hovered = ref(EMPTY)
const clicked = ref(EMPTY)
const picked = ref(EMPTY)
const isPicking = ref(false)

async function onReady() {
  const current = editor.value
  if (!current) return
  try {
    await current.selectObjects([planObject])
    // Adding the agent again does nothing, so a second ready event keeps its cursor where it is.
    await current.addAgent(agent)
  } catch (error) {
    console.warn('Could not prepare the iframe element demo.', error)
  }
}

function onHover(event: CustomEvent<KritzelObjectElementHoverEvent>) {
  const { element } = event.detail
  hovered.value = element ? describe(element) : EMPTY
}

function onClick(event: CustomEvent<KritzelObjectElementClickEvent>) {
  clicked.value = describe(event.detail.element)
}

async function onPick(event: CustomEvent<KritzelObjectElementPickEvent>) {
  const { objectId, element } = event.detail
  picked.value = describe(element)
  isPicking.value = false
  const current = editor.value
  if (!current) return
  try {
    await current.setObjectElementPicking(objectId, false)
    await current.highlightObjectElements(objectId, [{ selector: element.selector, label: 'Picked' }])
    agent.setStatus(`Looking at ${element.kritzelId ?? element.tagName}`)
    // An element target: the agent's cursor moves to the element inside the iframe and follows it from then on.
    await agent.moveTo({ objectId, selector: element.selector })
  } catch (error) {
    console.warn('Could not point the agent at the picked element.', error)
  }
}

async function togglePicking() {
  const current = editor.value
  if (!current) return
  const enabled = !isPicking.value
  try {
    await current.setObjectElementPicking(planObject.id, enabled)
    isPicking.value = enabled
  } catch (error) {
    console.warn('Could not toggle element picking.', error)
  }
}

async function highlightButtons() {
  try {
    await editor.value?.highlightObjectElements(planObject.id, [{ selector: 'button' }])
  } catch (error) {
    console.warn('Could not highlight the buttons.', error)
  }
}

async function clearHighlights() {
  try {
    await editor.value?.clearObjectElementHighlights(planObject.id)
  } catch (error) {
    console.warn('Could not clear the highlights.', error)
  }
}
</script>

<template>
  <div class="page">
    <KritzelEditor
      ref="editor"
      editorId="dynamic-objects-iframe-elements"
      theme="light"
      :themes="themes"
      :workspaces="workspaces"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isToolbarVisible="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :isZoomPanelVisible="false"
      @isReady="onReady"
      @objectElementHover="onHover"
      @objectElementClick="onClick"
      @objectElementPick="onPick"
    />
    <section class="panel" aria-label="Iframe element interaction">
      <p class="hint">Select the card, then hover, click or pick an element.</p>
      <dl class="rows">
        <div class="row">
          <dt>Hovered</dt>
          <dd data-testid="hovered-element">{{ hovered }}</dd>
        </div>
        <div class="row">
          <dt>Clicked</dt>
          <dd data-testid="clicked-element">{{ clicked }}</dd>
        </div>
        <div class="row">
          <dt>Picked</dt>
          <dd data-testid="picked-element">{{ picked }}</dd>
        </div>
      </dl>
      <div class="actions">
        <button
          type="button"
          class="primary"
          data-testid="toggle-picking"
          :aria-pressed="isPicking"
          @click="togglePicking"
        >
          {{ isPicking ? 'Stop picking' : 'Pick element' }}
        </button>
        <button type="button" data-testid="highlight-controls" @click="highlightButtons">Highlight buttons</button>
        <button type="button" data-testid="clear-highlights" @click="clearHighlights">Clear</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page { position: relative; height: 100vh; }
.page > :first-child { display: block; width: 100%; height: 100%; }
.panel { position: absolute; left: 16px; bottom: 16px; z-index: 20; display: flex; flex-direction: column; gap: 8px; width: min(280px, calc(100% - 32px)); padding: 12px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff; box-shadow: 0 8px 24px rgba(32, 33, 36, 0.12); box-sizing: border-box; color: #202124; font-family: Roboto, system-ui, sans-serif; font-size: 13px; line-height: 1.4; }
.hint { margin: 0; color: #5f6368; }
.rows { display: grid; gap: 4px; margin: 0; }
.row { display: grid; grid-template-columns: 64px minmax(0, 1fr); gap: 8px; }
dt { color: #5f6368; }
dd { margin: 0; overflow: hidden; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.actions { display: flex; flex-wrap: wrap; gap: 6px; }
.actions > button { flex: 1 1 auto; }
.actions > .primary { flex-basis: 100%; }
button { height: 28px; padding: 0 10px; border: 1px solid #dadce0; border-radius: 8px; background: #ffffff; color: #202124; cursor: pointer; font: inherit; font-weight: 600; }
button:hover { background: #f3f4f6; }
button.primary { border-color: #42b883; background: #42b883; color: #ffffff; }
button.primary:hover { border-color: #369a6e; background: #369a6e; }
</style>
