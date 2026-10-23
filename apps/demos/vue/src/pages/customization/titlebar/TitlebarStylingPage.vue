<script setup lang="ts">
import {
  darkTheme,
  KritzelEditor,
  KritzelShape,
  KritzelWorkspace,
  lightTheme,
  ShapeType,
  type KritzelObjectTitlebarConfig,
  type KritzelTheme,
} from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { editorStyle, hostStyle } from '../../shared/demo-shared'

// `themes` replaces the registry, so each variant spreads the default titlebar tokens and overrides a few.
const transparentTitlebar = {
  backgroundColor: 'transparent',
  hoverBackgroundColor: 'transparent',
  activeBackgroundColor: 'transparent',
  offset: '2px',
  paddingX: '0',
}

const transparentTitlebarLightTheme: KritzelTheme = {
  ...vueThemeLight,
  titlebar: { ...lightTheme.titlebar, ...transparentTitlebar },
}

const transparentTitlebarDarkTheme: KritzelTheme = {
  ...vueThemeDark,
  titlebar: { ...darkTheme.titlebar, ...transparentTitlebar },
}

const themes = [transparentTitlebarLightTheme, transparentTitlebarDarkTheme]

const objectTitlebar: KritzelObjectTitlebarConfig = {
  left: [{ type: 'title', id: 'title' }],
  right: [
    { type: 'button', id: 'settings', icon: 'settings', tooltip: 'Settings' },
    { type: 'button', id: 'download', icon: 'download', tooltip: 'Download' },
    { type: 'button', id: 'play', icon: 'play', label: 'PLAY', variant: 'outlined' },
  ],
}

const frameConfig = {
  shapeType: ShapeType.Rectangle,
  fillColor: { light: '#faf9f5', dark: '#30302e' },
  strokeColor: { light: '#e8e6dc', dark: '#3e3e38' },
  strokeWidth: 2,
  hasTitlebar: true,
}

const workspaces = [
  new KritzelWorkspace({
    objects: [
      new KritzelShape({ ...frameConfig, name: 'Landing page', translateX: -270, translateY: -110, width: 300, height: 200 }),
      new KritzelShape({ ...frameConfig, name: 'Pricing', translateX: 70, translateY: -110, width: 200, height: 200 }),
    ],
  }),
]
</script>

<template>
  <div :style="hostStyle">
    <KritzelEditor
      editorId="titlebar-styling"
      theme="light"
      :themes="themes"
      :workspaces="workspaces"
      :objectTitlebar="objectTitlebar"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="true"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
    />
  </div>
</template>
