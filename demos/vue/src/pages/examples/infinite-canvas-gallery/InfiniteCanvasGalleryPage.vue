<script setup lang="ts">
import {
  getEditorRef,
  KritzelEditor,
  KritzelImage,
  type KritzelViewportState,
} from 'kritzel-vue'
import { vueThemeLight } from '../../../const/vue-theme-light'

const TOTAL_IMAGES = 4000
const CLUSTER_RADIUS = 14000
const MIN_IMAGE_SCALE = 0.9
const MAX_IMAGE_SCALE = 60
const BASE_IMAGE_SIZE = 220
const REGION_SIZE = 5400
const OVERSCAN_SCREENS = 1
const XY_SPREAD_FACTOR = 0.35
const Z_SPREAD_FACTOR = 1.25

type VirtualImageNode = {
  id: number
  x: number
  y: number
  z: number
  width: number
  height: number
  object: KritzelImage
}

const pseudoRandom = (seed: number): number => {
  const x = Math.sin(seed * 12.9898) * 43758.5453123
  return x - Math.floor(x)
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

const toRegionIndex = (value: number): number => Math.floor(value / REGION_SIZE)

const regionKey = (x: number, y: number): string => `${x}:${y}`

const depthToScale = (z: number): number => {
  const normalizedDepth = clamp((z + CLUSTER_RADIUS) / (2 * CLUSTER_RADIUS), 0, 1)
  const minLog = Math.log(MIN_IMAGE_SCALE)
  const maxLog = Math.log(MAX_IMAGE_SCALE)
  return Math.exp(minLog + normalizedDepth * (maxLog - minLog))
}

const pointInSphere = (index: number, count: number) => {
  const normalizedIndex = (index + 0.5) / count
  const radial = Math.cbrt(normalizedIndex) * CLUSTER_RADIUS
  const cosine = 1 - 2 * pseudoRandom(index * 0.61803398875 + 1)
  const sine = Math.sqrt(1 - cosine * cosine)
  const theta = 2 * Math.PI * pseudoRandom(index * 1.32471795724 + 7)

  return {
    x: radial * sine * Math.cos(theta) * XY_SPREAD_FACTOR,
    y: radial * sine * Math.sin(theta) * XY_SPREAD_FACTOR,
    z: radial * cosine * Z_SPREAD_FACTOR,
  }
}

const editor = getEditorRef('editor')

const nodesByRegion = new Map<string, VirtualImageNode[]>()
const nodesById = new Map<number, VirtualImageNode>()
const mountedNodeIds = new Set<number>()

let isReady = false
let isViewportUpdateInProgress = false
let pendingViewport: KritzelViewportState | null = null
let lastViewportRegionSignature = ''

async function onIsReady() {
  if (isReady || !editor.value) {
    return
  }

  isReady = true

  const existing = await editor.value.getAllObjects()
  if (existing.length > 0) {
    await editor.value.removeObjects(existing)
  }

  generateVirtualDataset()

  const initialViewport = await editor.value.getViewport()
  scheduleViewportUpdate(initialViewport)
}

function onViewportChange(event: CustomEvent<KritzelViewportState>) {
  if (!isReady) {
    return
  }

  scheduleViewportUpdate(event.detail)
}

function scheduleViewportUpdate(viewport: KritzelViewportState) {
  pendingViewport = viewport

  if (isViewportUpdateInProgress) {
    return
  }

  isViewportUpdateInProgress = true

  requestAnimationFrame(() => {
    void flushViewportUpdates()
  })
}

async function flushViewportUpdates() {
  try {
    while (pendingViewport) {
      const viewport = pendingViewport
      pendingViewport = null
      await syncVisibleObjects(viewport)
    }
  } finally {
    isViewportUpdateInProgress = false
  }
}

function generateVirtualDataset() {
  if (nodesById.size > 0) {
    return
  }

  for (let index = 0; index < TOTAL_IMAGES; index++) {
    const point = pointInSphere(index, TOTAL_IMAGES)
    const scale = depthToScale(point.z)
    const sizeJitter = 0.8 + pseudoRandom(index * 19.31 + 3) * 0.5
    const width = BASE_IMAGE_SIZE * sizeJitter
    const height = BASE_IMAGE_SIZE * sizeJitter
    const imageId = 100 + (index % 900)
    const object = new KritzelImage({
      src: `https://picsum.photos/id/${imageId}/500/500`,
      translateX: point.x,
      translateY: point.y,
      width,
      height,
      scale,
    })

    const node: VirtualImageNode = {
      id: index,
      x: point.x,
      y: point.y,
      z: point.z,
      width,
      height,
      object,
    }

    nodesById.set(node.id, node)
    const key = regionKey(toRegionIndex(node.x), toRegionIndex(node.y))
    const bucket = nodesByRegion.get(key)
    if (bucket) {
      bucket.push(node)
    } else {
      nodesByRegion.set(key, [node])
    }
  }
}

async function syncVisibleObjects(viewport: KritzelViewportState) {
  if (!editor.value) {
    return
  }

  const worldTopLeft = await editor.value.screenToWorld(0, 0)
  const worldBottomRight = await editor.value.screenToWorld(
    viewport.width,
    viewport.height,
  )

  const minX = Math.min(worldTopLeft.x, worldBottomRight.x)
  const maxX = Math.max(worldTopLeft.x, worldBottomRight.x)
  const minY = Math.min(worldTopLeft.y, worldBottomRight.y)
  const maxY = Math.max(worldTopLeft.y, worldBottomRight.y)

  const overscanX = (maxX - minX) * OVERSCAN_SCREENS
  const overscanY = (maxY - minY) * OVERSCAN_SCREENS

  const expandedMinX = minX - overscanX
  const expandedMaxX = maxX + overscanX
  const expandedMinY = minY - overscanY
  const expandedMaxY = maxY + overscanY

  const minRegionX = toRegionIndex(expandedMinX)
  const maxRegionX = toRegionIndex(expandedMaxX)
  const minRegionY = toRegionIndex(expandedMinY)
  const maxRegionY = toRegionIndex(expandedMaxY)

  const signature = `${minRegionX}:${maxRegionX}:${minRegionY}:${maxRegionY}`
  if (signature === lastViewportRegionSignature) {
    return
  }
  lastViewportRegionSignature = signature

  const desiredNodeIds = new Set<number>()

  for (let regionX = minRegionX; regionX <= maxRegionX; regionX++) {
    for (let regionY = minRegionY; regionY <= maxRegionY; regionY++) {
      const bucket = nodesByRegion.get(regionKey(regionX, regionY))
      if (!bucket) {
        continue
      }

      for (const node of bucket) {
        const halfWidth = node.width / 2
        const halfHeight = node.height / 2
        if (
          node.x + halfWidth < expandedMinX ||
          node.x - halfWidth > expandedMaxX ||
          node.y + halfHeight < expandedMinY ||
          node.y - halfHeight > expandedMaxY
        ) {
          continue
        }
        desiredNodeIds.add(node.id)
      }
    }
  }

  const nodesToRemove: VirtualImageNode[] = []
  for (const mountedNodeId of mountedNodeIds) {
    if (desiredNodeIds.has(mountedNodeId)) {
      continue
    }
    const node = nodesById.get(mountedNodeId)
    if (node) {
      nodesToRemove.push(node)
    }
  }

  const nodesToAdd: VirtualImageNode[] = []
  for (const nodeId of desiredNodeIds) {
    if (mountedNodeIds.has(nodeId)) {
      continue
    }
    const node = nodesById.get(nodeId)
    if (node) {
      nodesToAdd.push(node)
    }
  }

  if (nodesToRemove.length > 0) {
    await editor.value.removeObjects(nodesToRemove.map((node) => node.object))
    for (const node of nodesToRemove) {
      mountedNodeIds.delete(node.id)
    }
  }

  if (nodesToAdd.length > 0) {
    await editor.value.addObjects(nodesToAdd.map((node) => node.object))
    for (const node of nodesToAdd) {
      mountedNodeIds.add(node.id)
    }
  }
}
</script>

<template>
  <div class="canvas-wrapper">
    <KritzelEditor
      ref="editor"
      editorId="infinite-canvas-gallery"
      theme="light"
      :themes="[vueThemeLight]"
      :isMoreMenuVisible="true"
      :isWorkspaceManagerVisible="false"
      :isObjectDistanceFadingActive="true"
      :loginConfig="undefined"
      :style="{ display: 'block', width: '100%', height: '100%' }"
      @isReady="onIsReady"
      @viewportChange="onViewportChange"
    />
  </div>
</template>

<style scoped>
.canvas-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
  background:
    radial-gradient(circle at top left, rgba(66, 184, 131, 0.12), transparent 32%),
    linear-gradient(180deg, rgba(244, 251, 247, 1) 0%, rgba(233, 246, 239, 1) 100%);
  font-family: Inter, Segoe UI, sans-serif;
  color: #214f3d;
}
</style>
