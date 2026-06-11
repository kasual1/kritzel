<script setup lang="ts">
import { ref } from 'vue'
import {
  getEditorRef,
  KritzelEditor,
  KritzelImage,
  KritzelShape,
  ShapeType,
} from 'kritzel-vue'
import { customVueTheme } from '../../../const/custom-vue-theme'

type DefectStatus = 'Outstanding' | 'In Progress' | 'Resolved'

interface Defect {
  id: string
  title: string
  category: string
  x: number
  y: number
  status: DefectStatus
  pinId: string
}

const editor = getEditorRef('editor')

const pinSize = 30
const firstSeedPinCenter = { x: -60, y: 145 }
const secondSeedPinCenter = { x: 135, y: -80 }

const placingMode = ref(false)
const defects = ref<Defect[]>([])

let nextDefectId = 2

function getPinColor(status: DefectStatus) {
  if (status === 'Outstanding') return { light: '#dd0031', dark: '#ef4444' }
  if (status === 'In Progress') return { light: '#f59e0b', dark: '#f59e0b' }
  return { light: '#10b981', dark: '#10b981' }
}

async function onReady() {
  if (!editor.value) {
    return
  }

  const existing = await editor.value.getAllObjects()
  if (existing.length === 0) {
    await initializeBlueprint()
  } else {
    await restoreDefectsFromCanvas()
  }

  await normalizeSeedPin('pin-defect-1', firstSeedPinCenter)
  await normalizeSeedPin('pin-defect-2', secondSeedPinCenter)
}

async function initializeBlueprint() {
  if (!editor.value) {
    return
  }

  // 1. Load the blueprint floorplan as unselectable background scenery.
  const bg = await KritzelImage.fromUrl('/floorplan.png', {
    maxWidth: 660,
    maxHeight: 360,
  })

  bg.translateX = -bg.width / 2
  bg.translateY = -bg.height / 2

  await editor.value.addObject(bg)

  // 2. Seed initial reported defects onto the floor plan.
  const seedPins = [
    {
      id: 'defect-1',
      title: 'Kitchen Sink Drain Clog',
      category: 'Plumbing',
      x: firstSeedPinCenter.x,
      y: firstSeedPinCenter.y,
      status: 'Outstanding' as const,
    },
    {
      id: 'defect-2',
      title: 'Bathroom Toilet Running',
      category: 'Plumbing',
      x: secondSeedPinCenter.x,
      y: secondSeedPinCenter.y,
      status: 'In Progress' as const,
    },
  ]

  const initialList: Defect[] = []

  for (const d of seedPins) {
    const pinId = `pin-${d.id}`
    const pin = new KritzelShape({
      translateX: d.x - pinSize / 2,
      translateY: d.y - pinSize / 2,
      width: pinSize,
      height: pinSize,
      shapeType: ShapeType.Ellipse,
      fillColor: getPinColor(d.status),
      strokeColor: { light: '#ffffff', dark: '#ffffff' },
      strokeWidth: 2,
    })
    pin.id = pinId
    pin.isEditable = false
    await editor.value.addObject(pin)

    initialList.push({
      id: d.id,
      title: d.title,
      category: d.category,
      x: d.x,
      y: d.y,
      status: d.status,
      pinId,
    })
  }

  defects.value = initialList
}

async function normalizeSeedPin(pinId: string, center: { x: number; y: number }) {
  if (!editor.value) {
    return
  }

  const pin = (await editor.value.getObjectById(pinId)) as KritzelShape | undefined
  if (!pin) {
    return
  }

  await editor.value.updateObject(pin, {
    translateX: center.x - pinSize / 2,
    translateY: center.y - pinSize / 2,
    width: pinSize,
    height: pinSize,
  })
}

async function restoreDefectsFromCanvas() {
  if (!editor.value) {
    return
  }

  const all = await editor.value.getAllObjects()
  const pinObjects = all.filter(
    (o) => o.id.startsWith('pin-') && o instanceof KritzelShape,
  ) as KritzelShape[]

  const restoredList: Defect[] = []
  pinObjects.forEach((pin) => {
    const parts = pin.id.split('-')
    const id = parts.slice(1).join('-')

    let status: DefectStatus = 'Outstanding'
    const fillLight = (pin.fillColor as { light?: string } | undefined)?.light
    if (fillLight === '#f59e0b') {
      status = 'In Progress'
    } else if (fillLight === '#10b981') {
      status = 'Resolved'
    }

    let title = 'Defect'
    let category = 'Facility'
    if (id === 'defect-1') {
      title = 'Kitchen Sink Drain Clog'
      category = 'Plumbing'
    } else if (id === 'defect-2') {
      title = 'Bathroom Toilet Running'
      category = 'Plumbing'
    } else if (id === 'defect-3') {
      title = 'Exposed Electrical Terminal'
      category = 'Electrical'
    } else {
      title = `Pinned Defect ${id}`
      category = 'Manual'
    }

    const isFirstSeedPin = pin.id === 'pin-defect-1'
    const isSecondSeedPin = pin.id === 'pin-defect-2'
    restoredList.push({
      id: id || pin.id,
      title,
      category,
      x: isFirstSeedPin
        ? firstSeedPinCenter.x
        : isSecondSeedPin
          ? secondSeedPinCenter.x
          : Math.round(pin.translateX + pin.width / 2),
      y: isFirstSeedPin
        ? firstSeedPinCenter.y
        : isSecondSeedPin
          ? secondSeedPinCenter.y
          : Math.round(pin.translateY + pin.height / 2),
      status,
      pinId: pin.id,
    })
  })

  defects.value = restoredList
}

function togglePlacingMode() {
  const newMode = !placingMode.value
  placingMode.value = newMode
  if (newMode) {
    // Force the selection tool so clicks place a pin instead of drawing marks.
    editor.value?.changeActiveToolByName('select')
  }
}

async function onCanvasClick(event: MouseEvent) {
  if (!placingMode.value || !editor.value) {
    return
  }

  const rect = editor.value.getBoundingClientRect()
  const screenX = event.clientX - rect.left
  const screenY = event.clientY - rect.top

  // Convert the screen pointer location into real-world blueprint units.
  const worldPos = await editor.value.screenToWorld(screenX, screenY)

  const defectId = `defect-user-${++nextDefectId}`
  const pinId = `pin-${defectId}`

  const pin = new KritzelShape({
    translateX: worldPos.x - pinSize / 2,
    translateY: worldPos.y - pinSize / 2,
    width: pinSize,
    height: pinSize,
    shapeType: ShapeType.Ellipse,
    fillColor: getPinColor('Outstanding'),
    strokeColor: { light: '#ffffff', dark: '#ffffff' },
    strokeWidth: 2,
  })
  pin.id = pinId
  pin.isEditable = false

  await editor.value.addObject(pin)

  defects.value = [
    ...defects.value,
    {
      id: defectId,
      title: `Defect #${nextDefectId}`,
      category: 'Manual Pin',
      x: Math.round(worldPos.x),
      y: Math.round(worldPos.y),
      status: 'Outstanding',
      pinId,
    },
  ]

  placingMode.value = false
}

async function zoomToDefect(defect: Defect) {
  // Center the viewport on the defect pin's absolute world coordinates.
  await editor.value?.setViewport(defect.x, defect.y, 1.25)
}

async function resetView() {
  await editor.value?.setViewport(0, 0, 1)
}

async function changeDefectStatus(defect: Defect, newStatus: DefectStatus) {
  defects.value = defects.value.map((d) =>
    d.id === defect.id ? { ...d, status: newStatus } : d,
  )

  const pin = (await editor.value?.getObjectById(defect.pinId)) as
    | KritzelShape
    | undefined
  if (pin) {
    await editor.value?.updateObject(pin, {
      fillColor: getPinColor(newStatus),
    })
  }
}

async function findPinsForDefect(defect: Defect): Promise<KritzelShape[]> {
  if (!editor.value) {
    return []
  }

  const idCandidates = Array.from(
    new Set([defect.pinId, `pin-${defect.id}`, defect.id]),
  )

  const directMatches: KritzelShape[] = []
  for (const id of idCandidates) {
    const pin = (await editor.value.getObjectById(id)) as KritzelShape | null
    if (pin && pin instanceof KritzelShape && pin.shapeType === ShapeType.Ellipse) {
      directMatches.push(pin)
    }
  }

  if (directMatches.length > 0) {
    return directMatches
  }

  const all = await editor.value.getAllObjects()
  const idMatches = all.filter(
    (obj) =>
      obj instanceof KritzelShape &&
      obj.shapeType === ShapeType.Ellipse &&
      idCandidates.includes(obj.id),
  ) as KritzelShape[]

  if (idMatches.length > 0) {
    return idMatches
  }

  // Fallback for legacy/persisted IDs: match the nearest pin to the defect.
  const ellipsePins = all.filter(
    (obj) => obj instanceof KritzelShape && obj.shapeType === ShapeType.Ellipse,
  ) as KritzelShape[]

  const maxDistance = pinSize
  let bestMatch: KritzelShape | null = null
  let bestDistance = Number.POSITIVE_INFINITY

  for (const pin of ellipsePins) {
    const centerX = pin.translateX + pin.width / 2
    const centerY = pin.translateY + pin.height / 2
    const distance = Math.hypot(centerX - defect.x, centerY - defect.y)
    if (distance <= maxDistance && distance < bestDistance) {
      bestMatch = pin
      bestDistance = distance
    }
  }

  return bestMatch ? [bestMatch] : []
}

async function deleteDefect(defect: Defect, event: MouseEvent) {
  event.stopPropagation()

  const pins = await findPinsForDefect(defect)
  if (pins.length === 1 && pins[0]) {
    await editor.value?.removeObject(pins[0])
  } else if (pins.length > 1) {
    await editor.value?.removeObjects(pins)
  }

  defects.value = defects.value.filter((d) => d.id !== defect.id)
}

function statusClass(status: DefectStatus): string {
  return status.toLowerCase().replace(' ', '-')
}
</script>

<template>
  <div class="mapper-workspace">
    <div class="editor-pane">
      <KritzelEditor
        ref="editor"
        editorId="blueprint-defect-mapper"
        theme="vue-theme"
        :themes="[customVueTheme]"
        :isControlsVisible="false"
        :isMoreMenuVisible="false"
        :isWorkspaceManagerVisible="false"
        :wheelEnabled="false"
        :loginConfig="undefined"
        :style="{ display: 'block', width: '100%', height: '100%' }"
        @isReady="onReady"
        @click="onCanvasClick"
      />

      <div v-if="placingMode" class="placing-toast">
        Click anywhere on the blueprint to place a defect pin
      </div>
    </div>

    <aside class="sidebar">
      <div class="sidebar-header">
        <span class="badge">Facilities</span>
        <h2 class="sidebar-title">Blueprint Defect Mapper</h2>
        <p class="sidebar-desc">
          Report and monitor structural defects directly onto floor plan
          blueprints.
        </p>
      </div>

      <div class="map-controls">
        <button
          class="action-btn"
          :class="{ active: placingMode }"
          @click="togglePlacingMode"
        >
          {{ placingMode ? 'Cancel Pin Placement' : 'Place New Defect Pin' }}
        </button>
        <button class="reset-btn" @click="resetView">Reset Zoom</button>
      </div>

      <div class="defects-section">
        <div class="section-title-row">
          <h3>Reported Defects ({{ defects.length }})</h3>
        </div>

        <div class="defects-list">
          <div v-if="defects.length === 0" class="empty-list">
            No defects reported. Click "Place New Defect Pin" to report site
            defects.
          </div>
          <template v-else>
            <div
              v-for="d in defects"
              :key="d.id"
              class="defect-card"
              @click="zoomToDefect(d)"
            >
              <div class="defect-header">
                <span class="status-indicator" :class="statusClass(d.status)"></span>
                <span class="defect-title">{{ d.title }}</span>
                <span class="defect-cat">{{ d.category }}</span>
              </div>
              <div class="defect-body">Units: x: {{ d.x }}, y: {{ d.y }}</div>
              <div class="defect-footer">
                <select
                  class="status-select"
                  :value="d.status"
                  @click.stop
                  @change="
                    changeDefectStatus(
                      d,
                      ($event.target as HTMLSelectElement).value as DefectStatus,
                    )
                  "
                >
                  <option value="Outstanding">Outstanding</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
                <button class="delete-btn" @click="deleteDefect(d, $event)">
                  Delete
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.mapper-workspace {
  display: flex;
  height: 100%;
  width: 100%;
  font-family: Inter, Segoe UI, sans-serif;
  background:
    linear-gradient(180deg, rgba(244, 251, 247, 1) 0%, rgba(233, 246, 239, 1) 100%);
}

.editor-pane {
  flex: 1;
  position: relative;
  height: 100%;
}

.placing-toast {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(66, 184, 131, 0.96);
  color: white;
  padding: 8px 20px;
  border-radius: 99px;
  font-size: 13px;
  font-weight: 500;
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);
  z-index: 10;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.sidebar {
  width: 320px;
  border-left: 1px solid #d4ece0;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-shadow: -1px 0 3px rgba(66, 184, 131, 0.05);
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #d4ece0;
}

.badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  background-color: rgba(66, 184, 131, 0.1);
  color: #42b883;
  padding: 2px 8px;
  border-radius: 99px;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.sidebar-title {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #214f3d;
}

.sidebar-desc {
  margin: 0;
  font-size: 12px;
  color: #587467;
  line-height: 1.4;
}

.map-controls {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(66, 184, 131, 0.03);
  border-bottom: 1px solid #d4ece0;
}

.action-btn {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #42b883;
  border-radius: 6px;
  background: #ffffff;
  color: #42b883;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  justify-content: center;
  align-items: center;
}

.action-btn:hover,
.action-btn.active {
  background: #42b883;
  color: #ffffff;
}

.reset-btn {
  padding: 8px 12px;
  border: 1px solid #c9e6d8;
  border-radius: 6px;
  background: #ffffff;
  color: #2c5f49;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.reset-btn:hover {
  background: rgba(66, 184, 131, 0.07);
}

.defects-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.section-title-row {
  padding: 12px 16px 8px 16px;
}

.section-title-row h3 {
  margin: 0;
  font-size: 14px;
  color: #214f3d;
  font-weight: 600;
}

.defects-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-list {
  padding: 32px 16px;
  text-align: center;
  color: #587467;
  font-size: 13px;
  border: 1px dashed #c9e6d8;
  border-radius: 8px;
}

.defect-card {
  border: 1px solid #d4ece0;
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  background: #ffffff;
}

.defect-card:hover {
  border-color: #42b883;
  box-shadow: 0 2px 4px rgba(66, 184, 131, 0.08);
}

.defect-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-indicator.outstanding {
  background-color: #42b883;
}

.status-indicator.in-progress {
  background-color: #f59e0b;
}

.status-indicator.resolved {
  background-color: #10b981;
}

.defect-title {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.defect-cat {
  font-size: 10px;
  background: rgba(66, 184, 131, 0.08);
  color: #2c5f49;
  padding: 2px 6px;
  border-radius: 99px;
  font-weight: 500;
}

.defect-body {
  font-size: 11px;
  color: #587467;
  margin-bottom: 8px;
  font-family: monospace;
}

.defect-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  border-top: 1px solid #e4f1ea;
  padding-top: 8px;
}

.status-select {
  font-size: 11px;
  padding: 3px 6px;
  border: 1px solid #c9e6d8;
  border-radius: 4px;
  background: white;
  color: #214f3d;
}

.delete-btn {
  font-size: 11px;
  color: #64748b;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 2px 4px;
}

.delete-btn:hover {
  color: #42b883;
}
</style>
