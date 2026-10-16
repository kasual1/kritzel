<script setup lang="ts">
import {
  getEditorRef,
  KritzelEditor,
  KritzelWorkspace,
  type KritzelAgenticCursorDetachedEvent,
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

async function getShapeIds() {
  const shapes = (await editor.value?.findObjects(obj => obj.__class__ === 'KritzelShape')) ?? []
  return shapes.map(shape => shape.id)
}

async function addCursors() {
  if (!editor.value) return

  const [rectangleId] = await getShapeIds()
  await editor.value.clearAgenticCursors()
  await editor.value.addAgenticCursor({
    id: PLANNER,
    name: 'Planner',
    color: '#7C3AED',
    position: rectangleId ? { objectId: rectangleId, anchor: 'top-right' } : { x: 0, y: 0 },
  })
  await editor.value.addAgenticCursor({
    id: WRITER,
    name: 'Writer',
    color: '#0EA5E9',
    status: 'Waiting…',
    position: { x: -220, y: 60 },
  })
}

async function runAgent() {
  const current = editor.value
  if (!current || isRunning.value) return
  isRunning.value = true
  message.value = ''

  try {
    const [rectangleId, ellipseId] = await getShapeIds()
    if (!rectangleId || !ellipseId) return
    if (!(await current.getAgenticCursor(PLANNER))) {
      await addCursors()
    }

    await current.updateAgenticCursor(PLANNER, { status: 'Thinking…' })
    await current.updateAgenticCursor(WRITER, { status: 'Waiting…' })
    await current.moveAgenticCursor(PLANNER, { x: -40, y: -20 })

    await current.updateAgenticCursor(PLANNER, { status: 'Reviewing shapes' })
    await current.updateAgenticCursor(WRITER, { status: 'Writing notes' })
    await Promise.all([
      current.moveAgenticCursor(PLANNER, { objectId: ellipseId, anchor: 'top-left' }),
      current.moveAgenticCursor(WRITER, { objectId: rectangleId, anchor: 'bottom-right' }, { duration: 900, easing: 'ease-out' }),
    ])

    await current.updateAgenticCursor(PLANNER, { status: 'Done' })
    await current.updateAgenticCursor(WRITER, { status: null })
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
  if (!(await current.getAgenticCursor(PLANNER))) {
    await addCursors()
  }
  await current.updateAgenticCursor(PLANNER, { status: 'Following selection' })
  await current.moveAgenticCursor(PLANNER, { objectId: selected.id, anchor: 'center' })
  message.value = 'Drag the object - the Planner cursor follows it.'
}

function onDetached(event: CustomEvent<KritzelAgenticCursorDetachedEvent>) {
  message.value = `"${event.detail.id}" detached (${event.detail.reason}).`
}
</script>

<template>
  <div :style="hostStyle">
    <Toolbar>
      <span class="label">Agentic Cursors</span>
      <button :disabled="isRunning" @click="runAgent">Run Agent</button>
      <button @click="attachToSelection">Attach to Selection</button>
      <button @click="addCursors">Reset</button>
      <span v-if="message" class="label">{{ message }}</span>
    </Toolbar>
    <KritzelEditor
      ref="editor"
      editorId="agentic-cursors-basic"
      theme="light"
      :themes="themes"
      :workspaces="workspaces"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
      @isReady="addCursors"
      @agenticCursorDetached="onDetached"
    />
  </div>
</template>
