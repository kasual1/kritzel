<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import {
  getEditorRef,
  KritzelEditor,
  type KritzelSyncConfig,
  type ObjectsAddedEvent,
  type ObjectsRemovedEvent,
  type ObjectsUpdatedEvent,
  ShapeType,
} from 'kritzel-vue'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../basic-usage/seed-objects'

const editor = getEditorRef('editor')

type AnyObject = any

const syncConfig: KritzelSyncConfig = {
  providers: [],
}

const availableTypes = ['KritzelShape', 'KritzelText', 'KritzelLine', 'KritzelPath']

const allObjects = ref<AnyObject[]>([])
const expandedGroups = ref<Set<string>>(new Set())
const selectedObject = ref<AnyObject | null>(null)
const searchQuery = ref('')
const selectedTypes = ref<Set<string>>(new Set([...availableTypes, 'KritzelGroup']))

let selectionListenerAttached = false
const handleSelectionChange = () => {
  void syncInspectorWithSelection()
}

const childIds = computed(() => {
  const ids = new Set<string>()
  allObjects.value.forEach((obj) => {
    if (obj.__class__ === 'KritzelGroup') {
      const group = obj as unknown as { childIds?: string[] }
      group.childIds?.forEach((id) => ids.add(id))
    }
  })
  return ids
})

const rootObjects = computed(() => {
  const children = childIds.value
  return allObjects.value.filter((obj) => !children.has(obj.id))
})

const visibleRootsCount = computed(
  () => rootObjects.value.filter((root) => isNodeVisible(root)).length,
)

const flatNodes = computed(() => {
  const result: { obj: AnyObject; depth: number }[] = []
  const walk = (obj: AnyObject, depth: number) => {
    if (!isNodeVisible(obj)) {
      return
    }
    result.push({ obj, depth })
    if (obj.__class__ === 'KritzelGroup' && isExpanded(obj.id)) {
      for (const child of getGroupChildren(obj)) {
        walk(child, depth + 1)
      }
    }
  }
  for (const root of rootObjects.value) {
    walk(root, 0)
  }
  return result
})

async function onIsReady() {
  if (!editor.value) {
    return
  }

  const existing = await editor.value.getAllObjects()
  if (existing.length === 0) {
    await seedObjects()
  }
  const all = await editor.value.getAllObjects()
  allObjects.value = [...all] as unknown as AnyObject[]
  await applyTypeOpacityFilter()

  if (!selectionListenerAttached) {
    editor.value.addEventListener('objectsSelectionChange', handleSelectionChange)
    selectionListenerAttached = true
  }

  await syncInspectorWithSelection()
}

onBeforeUnmount(() => {
  if (selectionListenerAttached && editor.value) {
    editor.value.removeEventListener(
      'objectsSelectionChange',
      handleSelectionChange,
    )
    selectionListenerAttached = false
  }
})

async function onObjectsAdded(event: CustomEvent<ObjectsAddedEvent>) {
  allObjects.value = [
    ...allObjects.value,
    ...(event.detail.objects as AnyObject[]),
  ]
  await applyTypeOpacityFilter()
}

function onObjectsRemoved(event: CustomEvent<ObjectsRemovedEvent>) {
  const removedIds = new Set(event.detail.objects.map((o) => o.id))
  allObjects.value = allObjects.value.filter((o) => !removedIds.has(o.id))

  const active = selectedObject.value
  if (active && removedIds.has(active.id)) {
    selectedObject.value = null
  }
}

function onObjectsUpdated(event: CustomEvent<ObjectsUpdatedEvent>) {
  const updatedMap = new Map(
    event.detail.objects.map((o) => [o.object.id, o.object as AnyObject]),
  )
  allObjects.value = allObjects.value.map((o) => updatedMap.get(o.id) ?? o)

  const active = selectedObject.value
  if (active && updatedMap.has(active.id)) {
    selectedObject.value = updatedMap.get(active.id) ?? null
  }
}

function onSearchInput(event: Event) {
  searchQuery.value = (event.target as HTMLInputElement).value
}

async function toggleTypeFilter(type: string) {
  const next = new Set(selectedTypes.value)
  if (next.has(type)) {
    next.delete(type)
  } else {
    next.add(type)
  }
  selectedTypes.value = next

  await applyTypeOpacityFilter()
}

function isExpanded(groupId: string): boolean {
  return expandedGroups.value.has(groupId)
}

function toggleExpand(event: Event, obj: AnyObject) {
  event.stopPropagation()
  if (obj.__class__ !== 'KritzelGroup') {
    return
  }
  const next = new Set(expandedGroups.value)
  if (next.has(obj.id)) {
    next.delete(obj.id)
  } else {
    next.add(obj.id)
  }
  expandedGroups.value = next
}

function getGroupChildren(groupObj: AnyObject): AnyObject[] {
  const group = groupObj as unknown as { childIds?: string[] }
  if (!group.childIds) {
    return []
  }
  return allObjects.value.filter((o) => group.childIds!.includes(o.id))
}

function isNodeVisible(obj: AnyObject): boolean {
  return (
    matchesFilter(obj) ||
    (obj.__class__ === 'KritzelGroup' && hasMatchingDescendant(obj))
  )
}

function matchesFilter(obj: AnyObject): boolean {
  const types = selectedTypes.value
  if (!types.has(obj.__class__)) {
    return false
  }

  const query = searchQuery.value.toLowerCase().trim()
  if (!query) {
    return true
  }

  if (obj.id.toLowerCase().includes(query)) {
    return true
  }
  if (obj.__class__.toLowerCase().includes(query)) {
    return true
  }

  if (obj.__class__ === 'KritzelText') {
    const txt = (obj as unknown as { text?: string }).text || ''
    if (txt.toLowerCase().includes(query)) {
      return true
    }
  }

  if (obj.__class__ === 'KritzelShape') {
    const shapeType = (obj as unknown as { shapeType?: string }).shapeType || ''
    if (shapeType.toLowerCase().includes(query)) {
      return true
    }
  }

  return false
}

function hasMatchingDescendant(groupObj: AnyObject): boolean {
  const children = getGroupChildren(groupObj)
  for (const child of children) {
    if (matchesFilter(child)) {
      return true
    }
    if (child.__class__ === 'KritzelGroup' && hasMatchingDescendant(child)) {
      return true
    }
  }
  return false
}

function getDisplayName(obj: AnyObject): string {
  switch (obj.__class__) {
    case 'KritzelGroup': {
      const count = (obj as unknown as { childIds?: string[] }).childIds?.length ?? 0
      return `Group (${count} items)`
    }
    case 'KritzelShape': {
      const shape = obj as unknown as { shapeType?: ShapeType }
      return shape.shapeType === ShapeType.Ellipse ? 'Ellipse' : 'Rectangle'
    }
    case 'KritzelText': {
      const txt = (obj as unknown as { text?: string }).text || 'Blank Text'
      return `Text "${txt.length > 15 ? `${txt.slice(0, 15)}...` : txt}"`
    }
    case 'KritzelLine':
      return 'Line'
    case 'KritzelPath':
      return 'Brush Path'
    default:
      return obj.__class__.replace('Kritzel', '')
  }
}

async function selectTreeObject(obj: AnyObject) {
  selectedObject.value = obj
  await editor.value?.panToObject(obj)
  await editor.value?.selectObjects([obj])
}

async function deleteTreeObject(event: Event, obj: AnyObject) {
  event.stopPropagation()
  await editor.value?.removeObject(obj)
}

function getTextContent(obj: AnyObject): string {
  return (obj as unknown as { text?: string }).text ?? ''
}

function getShapeFillColor(obj: AnyObject): string {
  return resolveThemeColor((obj as unknown as { fillColor?: unknown }).fillColor, '#ffffff')
}

function getPathFillColor(obj: AnyObject): string {
  return resolveThemeColor((obj as unknown as { fill?: unknown }).fill, '#000000')
}

function getPathStrokeColor(obj: AnyObject): string {
  return resolveThemeColor((obj as unknown as { stroke?: unknown }).stroke, '#000000')
}

function getOpacityPercent(obj: AnyObject): number {
  return Math.round((obj.opacity ?? 1) * 100)
}

async function updateSelectedProperty(prop: string, event: Event) {
  const active = selectedObject.value
  if (!active) {
    return
  }

  let value: unknown
  if (event.target instanceof HTMLInputElement) {
    if (event.target.type === 'number' || event.target.type === 'range') {
      value = parseFloat(event.target.value)
    } else {
      value = event.target.value
    }
  } else {
    value = (event.target as HTMLInputElement).value
  }

  const payload: Record<string, unknown> = {}
  if (prop === 'fillColor' || prop === 'fill' || prop === 'stroke') {
    payload[prop] = { light: value, dark: value }
  } else {
    payload[prop] = value
  }

  await editor.value?.updateObject(active, payload)
}

async function syncInspectorWithSelection() {
  const selected = (await editor.value?.getSelectedObjects()) ?? []
  selectedObject.value = (selected[0] as unknown as AnyObject) ?? null
}

async function applyTypeOpacityFilter() {
  if (!editor.value) {
    return
  }
  const types = selectedTypes.value
  const updates = allObjects.value.map((obj) => {
    const targetOpacity = types.has(obj.__class__) ? 1 : 0.5
    const currentOpacity = obj.opacity ?? 1
    if (currentOpacity !== targetOpacity) {
      return editor.value!.updateObject(obj, { opacity: targetOpacity })
    }
    return Promise.resolve()
  })

  await Promise.all(updates)
}

function resolveThemeColor(raw: unknown, fallback: string): string {
  if (!raw) {
    return fallback
  }
  if (typeof raw === 'object') {
    const color =
      (raw as { light?: string; dark?: string }).light ||
      (raw as { light?: string; dark?: string }).dark
    if (typeof color === 'string' && color.startsWith('#')) {
      return color
    }
    return fallback
  }
  if (typeof raw === 'string' && raw.startsWith('#')) {
    return raw
  }
  return fallback
}

async function seedObjects() {
  for (const obj of createSeedObjects()) {
    await editor.value?.addObject(obj)
  }
}
</script>

<template>
  <div class="content-shell">
    <div class="editor-container">
      <KritzelEditor
        ref="editor"
        editorId="object-explorer"
        theme="vue-theme"
        :themes="[vueThemeLight]"
        :syncConfig="syncConfig"
        :isMoreMenuVisible="false"
        :isWorkspaceManagerVisible="false"
        :isPanningEnabled="false"
        :isZoomingEnabled="false"
        :loginConfig="undefined"
        :style="{ display: 'block', width: '100%', height: '100%' }"
        @isReady="onIsReady"
        @objectsAdded="onObjectsAdded"
        @objectsRemoved="onObjectsRemoved"
        @objectsUpdated="onObjectsUpdated"
      />
    </div>

    <aside>
      <div class="panel-header">
        <span class="panel-tagline">Explorer Mode</span>
        <h2 class="panel-title">Hierarchical Object Explorer</h2>
      </div>

      <section class="section">
        <h4>Filters</h4>
        <input
          type="text"
          :value="searchQuery"
          placeholder="Search text, ID, or type..."
          class="search-input"
          @input="onSearchInput"
        />

        <div class="filter-header">Types</div>
        <div class="type-filters">
          <button
            v-for="type in availableTypes"
            :key="type"
            class="filter-chip"
            :class="{ active: selectedTypes.has(type) }"
            @click="toggleTypeFilter(type)"
          >
            {{ type.replace('Kritzel', '') }}
          </button>
        </div>
      </section>

      <section class="section">
        <h4>Canvas Hierarchy ({{ visibleRootsCount }} roots)</h4>
        <div class="tree-container">
          <div v-if="flatNodes.length === 0" class="empty-msg">
            No objects on canvas
          </div>
          <template v-else>
            <div
              v-for="node in flatNodes"
              :key="node.obj.id"
              class="tree-node"
              :style="{ paddingLeft: node.depth * 16 + 'px' }"
              :class="{
                selected: selectedObject?.id === node.obj.id,
                'hidden-obj': !node.obj.isVisible,
              }"
            >
              <span class="node-arrow" @click="toggleExpand($event, node.obj)">
                <template v-if="node.obj.__class__ === 'KritzelGroup'">
                  {{ isExpanded(node.obj.id) ? '▼' : '▶' }}
                </template>
                <template v-else>•</template>
              </span>

              <div class="node-content" @click="selectTreeObject(node.obj)">
                <span class="node-text">{{ getDisplayName(node.obj) }}</span>
                <span class="node-id">{{ node.obj.id.slice(0, 4) }}</span>
              </div>

              <div class="node-actions">
                <button
                  class="node-action delete"
                  title="Delete Object"
                  @click="deleteTreeObject($event, node.obj)"
                >
                  Delete
                </button>
              </div>
            </div>
          </template>
        </div>
      </section>

      <section v-if="selectedObject" class="section inspector">
        <h4>Inspector: {{ selectedObject.__class__.replace('Kritzel', '') }}</h4>

        <div class="inspector-field">
          <label>ID</label>
          <input type="text" :value="selectedObject.id" disabled class="input-disabled" />
        </div>

        <div class="inspector-field">
          <label>Position X / Y</label>
          <div class="coords-row">
            <input
              type="number"
              :value="selectedObject.translateX"
              @change="updateSelectedProperty('translateX', $event)"
            />
            <input
              type="number"
              :value="selectedObject.translateY"
              @change="updateSelectedProperty('translateY', $event)"
            />
          </div>
        </div>

        <div v-if="selectedObject.__class__ === 'KritzelText'" class="inspector-field">
          <label>Text Content</label>
          <input
            type="text"
            :value="getTextContent(selectedObject)"
            @change="updateSelectedProperty('text', $event)"
          />
        </div>

        <template v-if="selectedObject.__class__ === 'KritzelShape'">
          <div class="inspector-field">
            <label>Size W / H</label>
            <div class="coords-row">
              <input
                type="number"
                :value="selectedObject.width"
                @change="updateSelectedProperty('width', $event)"
              />
              <input
                type="number"
                :value="selectedObject.height"
                @change="updateSelectedProperty('height', $event)"
              />
            </div>
          </div>

          <div class="inspector-field">
            <label>Fill Color</label>
            <input
              type="color"
              :value="getShapeFillColor(selectedObject)"
              @change="updateSelectedProperty('fillColor', $event)"
            />
          </div>
        </template>

        <template v-if="selectedObject.__class__ === 'KritzelPath'">
          <div class="inspector-field">
            <label>Fill Color</label>
            <input
              type="color"
              :value="getPathFillColor(selectedObject)"
              @change="updateSelectedProperty('fill', $event)"
            />
          </div>

          <div class="inspector-field">
            <label>Stroke Color</label>
            <input
              type="color"
              :value="getPathStrokeColor(selectedObject)"
              @change="updateSelectedProperty('stroke', $event)"
            />
          </div>
        </template>

        <div class="inspector-field">
          <label>Opacity ({{ getOpacityPercent(selectedObject) }}%)</label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            :value="selectedObject.opacity"
            @input="updateSelectedProperty('opacity', $event)"
          />
        </div>
      </section>
    </aside>
  </div>
</template>

<style scoped>
.content-shell {
  display: flex;
  height: 100%;
  min-height: 0;
  font-family: Inter, Segoe UI, sans-serif;
  background:
    linear-gradient(180deg, rgba(244, 251, 247, 1) 0%, rgba(233, 246, 239, 1) 100%);
  color: #214f3d;
}

.editor-container {
  flex: 1;
  min-width: 0;
}

aside {
  width: 340px;
  overflow-y: auto;
  border-left: 1px solid #d4ece0;
  background-color: #ffffff;
  padding: 12px;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-header {
  border-bottom: 1px solid #d4ece0;
  padding-bottom: 10px;
}

.panel-tagline {
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

.panel-title {
  margin: 0;
  color: #42b883;
  font-size: 18px;
  line-height: 1.2;
}

h4 {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #587467;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section {
  border-bottom: 1px solid #e4f1ea;
  padding-bottom: 10px;
}

.section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

button {
  background: #ffffff;
  border: 1px solid #c9e6d8;
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 12px;
  font-family: inherit;
  color: #214f3d;
  box-shadow: 0 1px 2px rgba(66, 184, 131, 0.06);
  transition: all 0.2s ease;
}

button:hover,
button.active {
  background: #42b883;
  color: #ffffff;
}

.search-input {
  width: 100%;
  box-sizing: border-box;
  padding: 6px 8px;
  border: 1px solid #c9e6d8;
  border-radius: 4px;
  margin-bottom: 10px;
  font-size: 12px;
}

.search-input:focus {
  outline: none;
  border-color: #42b883;
}

.filter-header {
  font-size: 11px;
  color: #6d8579;
  margin: 6px 0 4px 0;
  text-transform: uppercase;
  letter-spacing: 0.2px;
}

.type-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;
}

.filter-chip {
  padding: 4px 8px;
  font-size: 11px;
  border-radius: 12px;
  box-shadow: none;
  border: 1px solid #d4ece0;
  background: rgba(66, 184, 131, 0.06);
  color: #42b883;
}

.tree-container {
  max-height: 320px;
  overflow-y: auto;
  border: 1px solid #d4ece0;
  border-radius: 4px;
  background: rgba(66, 184, 131, 0.02);
  padding: 4px;
}

.empty-msg {
  padding: 12px;
  text-align: center;
  color: #6d8579;
}

.tree-node {
  display: flex;
  align-items: center;
  padding: 4px 6px;
  border-radius: 4px;
  margin-bottom: 1px;
  transition: background 0.15s;
}

.tree-node:hover {
  background: rgba(66, 184, 131, 0.06);
}

.tree-node.selected {
  background: rgba(66, 184, 131, 0.08);
  border-left: 3px solid #42b883;
}

.tree-node.hidden-obj {
  opacity: 0.6;
}

.node-arrow {
  width: 16px;
  text-align: center;
  font-size: 10px;
  color: #587467;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
}

.node-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  min-width: 0;
}

.node-text {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
}

.node-id {
  color: #6d8579;
  font-size: 10px;
  flex-shrink: 0;
}

.node-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s;
}

.tree-node:hover .node-actions,
.tree-node.selected .node-actions {
  opacity: 1;
}

.node-action {
  background: transparent;
  border: none;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 10px;
  color: #587467;
  box-shadow: none;
}

.node-action.delete:hover {
  background: rgba(66, 184, 131, 0.08);
  color: #42b883;
}

.inspector {
  background: rgba(66, 184, 131, 0.02);
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #d4ece0;
}

.inspector-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.inspector-field label {
  font-weight: 600;
  color: #587467;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.2px;
}

.inspector-field input[type='text'],
.inspector-field input[type='number'],
.inspector-field input[type='color'] {
  padding: 4px 6px;
  border: 1px solid #c9e6d8;
  border-radius: 3px;
  font-size: 12px;
  font-family: inherit;
  color: #214f3d;
  background: #ffffff;
}

.inspector-field input:focus {
  outline: none;
  border-color: #42b883;
}

.inspector-field input[type='range'] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(90deg, #42b883, #369a6e);
  accent-color: #42b883;
  cursor: pointer;
}

.inspector-field input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #ffffff;
  background: #42b883;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  transition: transform 0.15s ease;
}

.inspector-field input[type='range']::-webkit-slider-thumb:hover {
  transform: scale(1.08);
}

.inspector-field input[type='range']::-moz-range-track {
  height: 6px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(90deg, #42b883, #369a6e);
}

.inspector-field input[type='range']::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #ffffff;
  background: #42b883;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  cursor: pointer;
}

.input-disabled {
  background: #eef7f2;
  color: #6d8579;
}

.coords-row {
  display: flex;
  gap: 4px;
}

.coords-row input {
  flex: 1;
  width: 50%;
}
</style>
