<script setup lang="ts">
import { KritzelEditor, KritzelWorkspace } from '@kritzel/vue-editor'
import type { KritzelSvgIconMap } from '@kritzel/editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import { editorStyle, hostStyle } from '../../shared/demo-shared'

const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]
const customSvgIcons: KritzelSvgIconMap = {
  cursor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m5 3 14 8-6 2-2 6Z"/><path d="m11 13 4 5"/></svg>',
  pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m20 4-9.5 9.5"/><path d="m15 3 6 6"/><path d="m4 20 4.5-1 9-9-3.5-3.5-9 9Z"/><path d="M3 21h18"/></svg>',
  type: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16"/><path d="M12 5v14"/><path d="M8 19h8"/></svg>',
}
</script>

<template>
  <div :style="hostStyle">
    <KritzelEditor
      editorId="icons-register"
      :customSvgIcons="customSvgIcons"
      :workspaces="workspaces"
      theme="light"
      :themes="themes"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :style="editorStyle"
    />
  </div>
</template>
