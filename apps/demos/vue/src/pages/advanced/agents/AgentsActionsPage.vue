<script setup lang="ts">
import {
  BroadcastSyncProvider,
  getEditorRef,
  KritzelAgent,
  KritzelAgentActionError,
  KritzelEditor,
  KritzelShape,
  KritzelWorkspace,
  ShapeType,
  type IKritzelUser,
  type KritzelAgentState,
  type KritzelObjectChangeSource,
  type KritzelSyncConfig,
  type ObjectsAddedEvent,
  type ObjectsRemovedEvent,
  type ObjectsUpdatedEvent,
} from '@kritzel/vue-editor'
import { onBeforeUnmount, ref } from 'vue'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { hostStyle, editorStyle } from '../../shared/demo-shared'
import Toolbar from '../../../components/Toolbar.vue'

const AGENT = 'agent'
const RECTANGLE_ID = 'agentic-actions-rectangle'
const ELLIPSE_ID = 'agentic-actions-ellipse'

/** Seeds with fixed IDs, so every tab of this page works on the same objects. */
function createActionSeeds() {
  const rectangle = new KritzelShape({
    translateX: -260,
    translateY: -120,
    width: 140,
    height: 90,
    shapeType: ShapeType.Rectangle,
    fillColor: { light: '#fce4ec', dark: '#880e4f' },
    strokeColor: { light: '#c62828', dark: '#ef9a9a' },
    strokeWidth: 3,
  })
  rectangle.id = RECTANGLE_ID
  const ellipse = new KritzelShape({
    translateX: -260,
    translateY: 80,
    width: 120,
    height: 120,
    shapeType: ShapeType.Ellipse,
    fillColor: { light: '#e3f2fd', dark: '#1a237e' },
    strokeColor: { light: '#1565c0', dark: '#90caf9' },
    strokeWidth: 3,
  })
  ellipse.id = ELLIPSE_ID
  return [rectangle, ellipse]
}

const editor = getEditorRef('editor')
const themes = [vueThemeLight, vueThemeDark]
const syncConfig: KritzelSyncConfig = { providers: [BroadcastSyncProvider] }
// One user per tab, so selections in other tabs count as collaborators.
const tabId = Math.random().toString(36).slice(2, 8)
const user: IKritzelUser = { id: `tab-${tabId}`, displayName: `Tab ${tabId}` }
const workspaces = [new KritzelWorkspace({ id: 'agentic-actions-demo', name: 'Agentic Actions', objects: createActionSeeds() })]

const agent = new KritzelAgent({ id: AGENT, name: 'Agent', color: '#7C3AED', position: { x: -400, y: -200 } })

const isRunning = ref(false)
const canUndo = ref(false)
const canRedo = ref(false)
const message = ref('')
const lastChange = ref('')

function syncHistory(state: KritzelAgentState) {
  canUndo.value = state.canUndo
  canRedo.value = state.canRedo
}
syncHistory(agent.state)
const offChange = agent.on('change', syncHistory)
onBeforeUnmount(offChange)

async function addAgent() {
  await editor.value?.addAgent(agent)
}

async function runScript() {
  const current = editor.value
  if (!current || isRunning.value) return
  isRunning.value = true
  message.value = ''

  try {
    await addAgent()
    // The first action that does not complete throws out of the task.
    await agent.task('Selecting', async () => {
      await agent.select([RECTANGLE_ID])
      agent.setStatus('Moving')
      await agent.moveObject(RECTANGLE_ID, { x: 40, y: -140 }, { align: 'top-left' })
      agent.setStatus('Resizing')
      await agent.resizeObject(RECTANGLE_ID, { width: 220 })
      agent.setStatus('Rotating')
      await agent.rotateObject(RECTANGLE_ID, 10)
      agent.setStatus('Adding a note')
      const { objectIds: [note] = [] } = await agent.createShape({
        x: 60,
        y: 90,
        width: 180,
        height: 90,
        text: 'Agent note',
        style: { fillColor: '#fff8e1', strokeColor: '#f59e0b' },
      })
      if (!note) throw new Error('createShape returned no object')
      agent.setStatus('Connecting')
      await agent.connect(ELLIPSE_ID, note)
      agent.setStatus('Underlining')
      await agent.drawPath([{ x: 60, y: 200 }, { x: 120, y: 215 }, { x: 180, y: 195 }, { x: 240, y: 210 }], { style: { strokeColor: '#7C3AED' } })
      agent.setStatus('Done')
      await agent.clearSelection()
    })
    message.value = "Script finished. Undo the agent's steps one by one, or open a second tab to watch the changes sync."
  } catch (error) {
    if (error instanceof KritzelAgentActionError) {
      message.value = `${error.action.type} stopped: ${error.reason}`
    } else {
      message.value = error instanceof Error ? error.message : String(error)
    }
  } finally {
    isRunning.value = false
  }
}

async function history(type: 'undo' | 'redo') {
  if (!editor.value || isRunning.value) return
  await addAgent()
  const result = await agent[type]()
  message.value = result.completed ? `Agent ${type} done.` : `Agent ${type} stopped: ${result.reason}`
}

function abort() {
  agent.cancel()
}

function onChange(source: KritzelObjectChangeSource | undefined, kind: string) {
  if (source) {
    lastChange.value = `${kind} by ${source.agentId} (${source.actionType})`
  }
}

const onAdded = (event: CustomEvent<ObjectsAddedEvent>) => onChange(event.detail.source, 'Added')
const onUpdated = (event: CustomEvent<ObjectsUpdatedEvent>) => onChange(event.detail.source, 'Updated')
const onRemoved = (event: CustomEvent<ObjectsRemovedEvent>) => onChange(event.detail.source, 'Removed')
</script>

<template>
  <div :style="hostStyle">
    <Toolbar>
      <span class="label">Agentic Actions</span>
      <button :disabled="isRunning" @click="runScript">Run Script</button>
      <button :disabled="isRunning || !canUndo" @click="history('undo')">Undo Agent</button>
      <button :disabled="isRunning || !canRedo" @click="history('redo')">Redo Agent</button>
      <button :disabled="!isRunning" @click="abort">Abort</button>
      <span v-if="message" class="label">{{ message }}</span>
      <span v-if="lastChange" class="status">{{ lastChange }}</span>
    </Toolbar>
    <KritzelEditor
      ref="editor"
      editorId="agents-actions"
      :syncConfig="syncConfig"
      :user="user"
      theme="light"
      :themes="themes"
      :workspaces="workspaces"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
      @isReady="addAgent"
      @objectsAdded="onAdded"
      @objectsUpdated="onUpdated"
      @objectsRemoved="onRemoved"
    />
  </div>
</template>
