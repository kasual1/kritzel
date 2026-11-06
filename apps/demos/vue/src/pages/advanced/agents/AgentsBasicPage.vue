<script setup lang="ts">
import {
  getEditorRef,
  KritzelAgent,
  KritzelEditor,
  KritzelWorkspace,
  type KritzelAgentOptions,
} from '@kritzel/vue-editor'
import { ref } from 'vue'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import { editorStyle, hostStyle } from '../../shared/demo-shared'
import Toolbar from '../../../components/Toolbar.vue'

const PLANNER = 'planner'
const WRITER = 'writer'

const editor = getEditorRef('editor')
const isRunning = ref(false)
const message = ref('')
const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]
// Recreated by Reset, so the Planner starts at the rectangle again.
let planner: KritzelAgent | null = null
let writer: KritzelAgent | null = null

async function getShapeIds() {
  const shapes = (await editor.value?.findObjects(obj => obj.__class__ === 'KritzelShape')) ?? []
  return shapes.map(shape => shape.id)
}

function createAgent(options: KritzelAgentOptions) {
  const agent = new KritzelAgent(options)
  agent.on('detached', ({ reason }) => {
    message.value = `"${agent.id}" detached (${reason}).`
  })
  return agent
}

async function addAgents() {
  const current = editor.value
  if (!current) return

  const [rectangleId] = await getShapeIds()
  for (const agent of await current.getAgents()) {
    await current.removeAgent(agent)
  }
  planner = createAgent({
    id: PLANNER,
    name: 'Planner',
    color: '#7C3AED',
    position: rectangleId ? { objectId: rectangleId, anchor: 'top-right' } : { x: 0, y: 0 },
  })
  writer = createAgent({
    id: WRITER,
    name: 'Writer',
    color: '#0EA5E9',
    status: 'Waiting…',
    position: { x: -220, y: 60 },
  })
  await current.addAgent(planner)
  await current.addAgent(writer)
}

async function ensureAgents() {
  if (!planner?.isAdded || !writer?.isAdded) {
    await addAgents()
  }
  return { planner: planner!, writer: writer! }
}

async function runAgent() {
  const current = editor.value
  if (!current || isRunning.value) return
  isRunning.value = true
  message.value = ''

  try {
    const [rectangleId, ellipseId] = await getShapeIds()
    if (!rectangleId || !ellipseId) return
    const { planner, writer } = await ensureAgents()

    planner.setStatus('Thinking…')
    writer.setStatus('Waiting…')
    await planner.moveTo({ x: -40, y: -20 })

    planner.setStatus('Reviewing shapes')
    writer.setStatus('Writing notes')
    await Promise.all([
      planner.moveTo({ objectId: ellipseId, anchor: 'top-left' }),
      writer.moveTo({ objectId: rectangleId, anchor: 'bottom-right' }, { duration: 900, easing: 'ease-out' }),
    ])

    planner.setStatus('Done')
    writer.setStatus(null)
  } finally {
    isRunning.value = false
  }
}

async function attachToSelection() {
  const current = editor.value
  if (!current) return
  const [selected] = await current.getSelectedObjects()
  if (!selected) {
    message.value = 'Select an object first.'
    return
  }
  const { planner } = await ensureAgents()
  planner.setStatus('Following selection')
  await planner.moveTo({ objectId: selected.id, anchor: 'center' })
  message.value = 'Drag the object - the Planner cursor follows it.'
}
</script>

<template>
  <div :style="hostStyle">
    <Toolbar>
      <span class="label">Agentic Cursors</span>
      <button :disabled="isRunning" @click="runAgent">Run Agent</button>
      <button @click="attachToSelection">Attach to Selection</button>
      <button @click="addAgents">Reset</button>
      <span v-if="message" class="label">{{ message }}</span>
    </Toolbar>
    <KritzelEditor
      ref="editor"
      editorId="agents-basic"
      theme="light"
      :themes="themes"
      :workspaces="workspaces"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
      @isReady="addAgents"
    />
  </div>
</template>
