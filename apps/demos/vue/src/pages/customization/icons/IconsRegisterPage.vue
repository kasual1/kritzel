<script setup lang="ts">
import { getEditorRef, KritzelBrushTool, KritzelEditor, KritzelSelectionTool, KritzelTextTool, type KritzelToolbarItem } from '@kritzel/vue-editor'
import { vueThemeLight } from '../../../const/vue-theme-light'

const editor = getEditorRef('editor')
const customSvgIcons: Record<string, string> = {
  'brand-select': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m5 3 14 8-6 2-2 6Z"/><path d="m11 13 4 5"/></svg>',
  'brand-ink': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m20 4-9.5 9.5"/><path d="m15 3 6 6"/><path d="m4 20 4.5-1 9-9-3.5-3.5-9 9Z"/><path d="M3 21h18"/></svg>',
  'brand-label': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16"/><path d="M12 5v14"/><path d="M8 19h8"/></svg>',
  'brand-export': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>',
}

const toolbarItems: KritzelToolbarItem[] = [
  { name: 'select', type: 'tool', tool: KritzelSelectionTool, icon: 'brand-select', isDefault: true },
  { name: 'brush', type: 'tool', tool: KritzelBrushTool, icon: 'brand-ink', config: { color: { light: '#1f2937', dark: '#f3f4f6' }, size: 6, palette: [{ light: '#1f2937', dark: '#f3f4f6' }] } },
  { name: 'text', type: 'tool', tool: KritzelTextTool, icon: 'brand-label', config: { color: { light: '#1f2937', dark: '#f3f4f6' }, size: 18, fontFamily: 'Arial', palette: [{ light: '#1f2937', dark: '#f3f4f6' }] } },
]
</script>

<template>
  <div class="page">
    <div class="toolbar"><strong>Custom SVG Icons:</strong> toolbar and context-menu icons use the same registered names.</div>
    <KritzelEditor ref="editor" editorId="icons-register" :customSvgIcons="customSvgIcons" :toolbarItems="toolbarItems" :globalContextMenuItems="[{ label: 'Export board', icon: 'brand-export' }]" :objectContextMenuItems="[{ label: 'Export selection', icon: 'brand-export' }]" theme="light" :themes="[vueThemeLight]" :isPanningEnabled="false" :isZoomingEnabled="false" :isMoreMenuVisible="false" :isWorkspaceManagerVisible="false" @isReady="() => editor?.openContextMenu({ x: -50, y: -50 })" />
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; height: 100vh; }
.toolbar { padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #ebebeb; font: 13px sans-serif; }
.toolbar strong { color: #dd0031; }
KritzelEditor { flex: 1; min-height: 0; }
</style>
