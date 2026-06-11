<script setup lang="ts">
import { ref } from 'vue'
import {
  getEditorRef,
  KritzelBrushTool,
  KritzelEditor,
  KritzelImage,
  KritzelTextTool,
  type KritzelTheme,
} from 'kritzel-vue'
import { customVueTheme } from '../../../const/custom-vue-theme'

type AnnotationMode = 'sketch' | 'text'

type ColorTool = {
  name: string
  label: string
  color: string
}

const editor = getEditorRef('editor')

const annotationTheme: KritzelTheme = {
  ...customVueTheme,
  name: 'annotation-vue-theme',
  engine: {
    ...customVueTheme.engine,
    backgroundColor: '#090f18',
    loadingOverlayBackground: 'rgba(9, 15, 24, 0.72)',
  },
}

const themes = [annotationTheme]

const colorTools: ColorTool[] = [
  { name: 'ink-black', label: 'Black', color: '#030712' },
  { name: 'ink-red', label: 'Red', color: '#f15f54' },
  { name: 'ink-yellow', label: 'Yellow', color: '#eab308' },
  { name: 'ink-green', label: 'Green', color: '#4ade80' },
  { name: 'ink-cyan', label: 'Cyan', color: '#38bdf8' },
  { name: 'ink-violet', label: 'Violet', color: '#c084fc' },
  { name: 'ink-gray', label: 'Gray', color: '#d1d5db' },
]

const activeMode = ref<AnnotationMode>('sketch')
const activeSketchTool = ref<string>('ink-red')

async function onReady() {
  await registerColorTools()
  await ensureSeedImage()
  await activateColorTool(activeSketchTool.value)
}

async function activateColorTool(toolName: string) {
  activeSketchTool.value = toolName
  activeMode.value = 'sketch'
  await syncTextColorToActiveSketchTool()
  await editor.value?.changeActiveToolByName(toolName)
}

async function activateMode(mode: AnnotationMode) {
  activeMode.value = mode

  if (mode === 'text') {
    await syncTextColorToActiveSketchTool()
    await editor.value?.changeActiveToolByName('text')
    return
  }

  await editor.value?.changeActiveToolByName(activeSketchTool.value)
}

async function undo() {
  await editor.value?.undo()
}

async function redo() {
  await editor.value?.redo()
}

async function download() {
  await editor.value?.exportViewportAsPng({
    includeBackground: false,
  })
}

async function zoomIn() {
  await editor.value?.zoomIn()
}

async function zoomOut() {
  await editor.value?.zoomOut()
}

async function registerColorTools() {
  for (const tool of colorTools) {
    await editor.value?.registerTool(tool.name, KritzelBrushTool, {
      type: 'pen',
      color: {
        light: tool.color,
        dark: tool.color,
      },
      size: 5,
      palettes: {
        pen: [
          {
            light: tool.color,
            dark: tool.color,
            label: tool.label,
          },
        ],
      },
    })
  }
}

async function syncTextColorToActiveSketchTool() {
  const activeSketchColor =
    colorTools.find((tool) => tool.name === activeSketchTool.value)?.color ??
    colorTools[0]?.color ??
    '#030712'

  const textColor = {
    light: activeSketchColor,
    dark: activeSketchColor,
  }

  // registerTool updates existing tools in-place, which keeps the text color
  // aligned with the currently selected sketch swatch.
  const textToolConfig = {
    fontColor: textColor,
  } as unknown as Parameters<
    NonNullable<typeof editor.value>['registerTool']
  >[2]

  await editor.value?.registerTool('text', KritzelTextTool, textToolConfig)
}

async function ensureSeedImage() {
  if (!editor.value) {
    return
  }

  const image = await KritzelImage.fromUrl(
    'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=1800&q=80',
    {
      maxWidth: 660,
      maxHeight: 360,
    },
  )

  image.translateX = -image.width / 2
  image.translateY = -image.height / 2 - 50

  await editor.value.addObject(image)
}
</script>

<template>
  <div class="annotation-page">
    <KritzelEditor
      ref="editor"
      editorId="image-annotation-studio"
      theme="annotation-vue-theme"
      :themes="themes"
      :scaleMax="10"
      :scaleMin="0.1"
      :isControlsVisible="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :isUtilityPanelVisible="false"
      :wheelEnabled="false"
      :loginConfig="undefined"
      :style="{ display: 'block', width: '100%', height: '100%' }"
      @isReady="onReady"
    />

    <div class="action-bar">
      <button
        class="action-btn icon-btn"
        type="button"
        aria-label="Undo"
        @click="undo"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.25"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M9 14 4 9l5-5" />
          <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
        </svg>
      </button>
      <button
        class="action-btn icon-btn"
        type="button"
        aria-label="Redo"
        @click="redo"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.25"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m15 14 5-5-5-5" />
          <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13" />
        </svg>
      </button>
      <button class="action-btn primary" type="button" @click="download">
        Download
      </button>
    </div>

    <div class="zoom-bar" aria-label="Zoom controls">
      <button
        class="action-btn zoom-btn"
        type="button"
        aria-label="Zoom out"
        @click="zoomOut"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.25"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M5 12h14" />
        </svg>
      </button>
      <button
        class="action-btn zoom-btn"
        type="button"
        aria-label="Zoom in"
        @click="zoomIn"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.25"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </svg>
      </button>
    </div>

    <div class="tool-dock">
      <div class="swatch-row">
        <button
          v-for="tool in colorTools"
          :key="tool.name"
          class="swatch-btn"
          :class="{ active: activeSketchTool === tool.name }"
          :style="{ background: tool.color }"
          :aria-label="'Activate ' + tool.label + ' sketch tool'"
          type="button"
          @click="activateColorTool(tool.name)"
        ></button>
      </div>

      <div class="mode-row" role="tablist" aria-label="Annotation mode">
        <button
          class="mode-btn"
          :class="{ active: activeMode === 'sketch' }"
          type="button"
          @click="activateMode('sketch')"
        >
          Sketch
        </button>
        <button
          class="mode-btn"
          :class="{ active: activeMode === 'text' }"
          type="button"
          @click="activateMode('text')"
        >
          Text
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.annotation-page {
  position: relative;
  height: 100%;
  width: 100%;
  overflow: hidden;
  color: #eef2ff;
  background:
    radial-gradient(
      circle at 15% 20%,
      rgba(251, 146, 60, 0.14),
      transparent 40%
    ),
    radial-gradient(
      circle at 85% 78%,
      rgba(59, 130, 246, 0.16),
      transparent 38%
    ),
    linear-gradient(120deg, #0d111a 0%, #181c2a 52%, #0f1724 100%);
  font-family: Inter, Segoe UI, sans-serif;
}

.tool-dock {
  position: absolute;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  pointer-events: none;
}

.tool-dock > * {
  pointer-events: auto;
}

.action-bar {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 24;
  display: flex;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}

.action-bar > * {
  pointer-events: auto;
}

.zoom-bar {
  position: absolute;
  left: 16px;
  bottom: 16px;
  z-index: 24;
  display: flex;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}

.zoom-bar > * {
  pointer-events: auto;
}

.action-btn {
  height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(10, 16, 28, 0.78);
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 120ms ease;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
}

.action-btn:hover {
  background: rgba(15, 23, 42, 0.95);
  border-color: rgba(255, 255, 255, 0.32);
}

.action-btn.primary {
  background: rgba(66, 184, 131, 0.92);
  border-color: rgba(255, 255, 255, 0.35);
  color: #ffffff;
}

.action-btn.primary:hover {
  background: rgba(54, 154, 110, 0.96);
}

.zoom-btn,
.icon-btn {
  width: 34px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.zoom-btn svg,
.icon-btn svg {
  display: block;
}

.swatch-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(11, 16, 27, 0.84);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
}

.swatch-btn {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.22);
  cursor: pointer;
  transition: transform 120ms ease;
}

.swatch-btn:hover {
  transform: translateY(-1px);
}

.swatch-btn.active {
  border-color: #ffffff;
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.25),
    0 0 0 6px rgba(255, 255, 255, 0.07);
}

.mode-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  border-radius: 999px;
  background: rgba(11, 16, 27, 0.84);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
}

.mode-btn {
  min-width: 96px;
  padding: 10px 14px;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: #dbeafe;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 120ms ease;
}

.mode-btn:hover {
  background: rgba(255, 255, 255, 0.14);
}

.mode-btn.active {
  background: #ffffff;
  color: #0f172a;
}

@media (max-width: 900px) {
  .tool-dock {
    bottom: 12px;
  }

  .action-bar {
    top: 12px;
    right: 12px;
  }

  .zoom-bar {
    left: 12px;
    bottom: 12px;
  }

  .action-btn {
    height: 30px;
    padding: 0 10px;
    font-size: 12px;
  }

  .zoom-btn,
  .icon-btn {
    width: 30px;
    padding: 0;
  }

  .swatch-row {
    gap: 8px;
  }

  .swatch-btn {
    width: 22px;
    height: 22px;
  }
}
</style>
