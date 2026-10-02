<script setup lang="ts">
import {
  KritzelBrushTool,
  KritzelEditor,
  KritzelLineTool,
  KritzelSelectionTool,
  KritzelShapeTool,
  KritzelTextTool,
  KritzelWorkspace,
  ShapeType,
  type KritzelToolbarItem,
} from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import { editorStyle, hostStyle } from '../../shared/demo-shared'

const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]

const toolbarItems: KritzelToolbarItem[] = [
  {
    name: 'selection',
    type: 'tool',
    tool: KritzelSelectionTool,
    icon: 'cursor',
  },
  {
    name: 'brush',
    type: 'tool',
    tool: KritzelBrushTool,
    icon: 'pen',
    isDefault: true,
    config: {
      color: { light: '#42b883', dark: '#7ee2b8', label: 'Vue Green' },
      size: 8,
      opacity: 1,
      palette: [
        { light: '#42b883', dark: '#7ee2b8', label: 'Vue Green' },
        { light: '#1f2937', dark: '#f3f4f6', label: 'Ink' },
        { light: '#0284c7', dark: '#38bdf8', label: 'Sky' },
      ],
      sizes: [4, 8, 16],
    },
  },
  {
    name: 'line',
    type: 'tool',
    tool: KritzelLineTool,
    icon: 'arrow',
    config: {
      color: { light: '#0284c7', dark: '#38bdf8', label: 'Sky' },
      size: 4,
      opacity: 0.8,
      palette: [
        { light: '#0284c7', dark: '#38bdf8', label: 'Sky' },
        { light: '#16a34a', dark: '#4ade80', label: 'Green' },
      ],
      sizes: [2, 4, 8],
      arrows: {
        start: { enabled: true, style: 'circle' },
        end: { enabled: true, style: 'triangle' },
      },
    },
  },
  {
    name: 'shape',
    type: 'tool',
    tool: KritzelShapeTool,
    icon: 'shapeEllipse',
    config: {
      shapeType: ShapeType.Ellipse,
      fillColor: { light: '#dcfce7', dark: '#14532d' },
      strokeColor: { light: '#42b883', dark: '#7ee2b8', label: 'Vue Green' },
      strokeWidth: 4,
      opacity: 1,
      fontColor: { light: '#1f2937', dark: '#f3f4f6', label: 'Ink' },
      fontSize: 16,
      fontFamily: 'Arial',
      palette: [
        { light: '#42b883', dark: '#7ee2b8', label: 'Vue Green' },
        { light: '#f59e0b', dark: '#fbbf24', label: 'Amber' },
        { light: '#1f2937', dark: '#f3f4f6', label: 'Ink' },
      ],
      sizes: [2, 4, 8],
    },
    subOptions: [
      { id: 'ellipse', icon: 'shapeEllipse', label: 'Ellipse', value: ShapeType.Ellipse, toolProperty: 'shapeType' },
      { id: 'rectangle', icon: 'shapeRectangle', label: 'Rectangle', value: ShapeType.Rectangle, toolProperty: 'shapeType' },
    ],
  },
  {
    name: 'text',
    type: 'tool',
    tool: KritzelTextTool,
    icon: 'type',
    config: {
      color: { light: '#1f2937', dark: '#f3f4f6', label: 'Ink' },
      size: 12,
      fontFamily: 'Georgia',
      availableFonts: ['Georgia', 'Courier New'],
      palette: [
        { light: '#1f2937', dark: '#f3f4f6', label: 'Ink' },
        { light: '#42b883', dark: '#7ee2b8', label: 'Vue Green' },
      ],
      sizes: [8, 12, 24],
    },
  },
  {
    name: 'config',
    type: 'config',
  },
]
</script>

<template>
  <div :style="hostStyle">
    <KritzelEditor
      editorId="tools-config"
      theme="light"
      :themes="themes"
      :workspaces="workspaces"
      :toolbarItems="toolbarItems"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
    />
  </div>
</template>