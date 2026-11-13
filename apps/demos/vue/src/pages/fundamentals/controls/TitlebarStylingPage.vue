<script setup lang="ts">
import {
  UpdrawEditor,
  UpdrawShape,
  UpdrawWorkspace,
  ShapeType,
  type UpdrawObjectConfig,
  type UpdrawObjectTitlebarConfig,
  type UpdrawTheme,
} from '@updraw/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { editorStyle, hostStyle } from '../../shared/demo-shared'

// `themes` replaces the registry, so each variant spreads the app theme's titlebar tokens and overrides a few.
const transparentTitlebar = {
  backgroundColor: 'transparent',
  hoverBackgroundColor: 'transparent',
  activeBackgroundColor: 'transparent',
  offset: '2px',
  paddingX: '0',
}

const transparentTitlebarLightTheme: UpdrawTheme = {
  ...vueThemeLight,
  titlebar: { ...vueThemeLight.titlebar, ...transparentTitlebar },
}

const transparentTitlebarDarkTheme: UpdrawTheme = {
  ...vueThemeDark,
  titlebar: { ...vueThemeDark.titlebar, ...transparentTitlebar },
}

const themes = [transparentTitlebarLightTheme, transparentTitlebarDarkTheme]

const objectConfig: UpdrawObjectConfig = {
  hasTitlebar: object => object.__class__ === 'UpdrawShape',
  isRotatable: false,
  isResizable: false,
}

const objectTitlebar: UpdrawObjectTitlebarConfig = {
  left: [{ type: 'title', id: 'title' }],
  right: [
    { type: 'button', id: 'settings', icon: 'settings', tooltip: 'Settings' },
    { type: 'button', id: 'download', icon: 'download', tooltip: 'Download' },
    { type: 'button', id: 'play', icon: 'play', label: 'PLAY', variant: 'outlined' },
  ],
}

const frameConfig = {
  shapeType: ShapeType.Rectangle,
  fillColor: { light: '#f5f6f7', dark: '#2b2c2f' },
  strokeColor: { light: '#f5f6f7', dark: '#2b2c2f' },
  strokeWidth: 2,
}

const workspaces = [
  new UpdrawWorkspace({
    objects: [
      new UpdrawShape({ ...frameConfig, name: 'Landing page', translateX: -270, translateY: -110, width: 300, height: 200 }),
      new UpdrawShape({ ...frameConfig, name: 'Pricing', translateX: 70, translateY: -110, width: 200, height: 200 }),
    ],
  }),
]
</script>

<template>
  <div :style="hostStyle">
    <UpdrawEditor
      editorId="titlebar-styling"
      theme="light"
      :themes="themes"
      :workspaces="workspaces"
      :objectConfig="objectConfig"
      :objectTitlebar="objectTitlebar"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="true"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
    />
  </div>
</template>
