<script setup lang="ts">
import { ref } from 'vue'
import { KritzelEditor, KritzelWorkspace } from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import { editorStyle, hostStyle } from '../../shared/demo-shared'
import Toolbar from '../../../components/Toolbar.vue'

const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]
const activeTheme = ref('light')
</script>

<template>
  <div :style="hostStyle">
    <Toolbar>
      <button :class="{ active: activeTheme === 'light' }" @click="activeTheme = 'light'">Light</button>
      <button :class="{ active: activeTheme === 'dark' }" @click="activeTheme = 'dark'">Dark</button>
    </Toolbar>
    <KritzelEditor
      editorId="theming-apply"
      :theme="activeTheme"
      :themes="themes"
      :workspaces="workspaces"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="true"
      :isWorkspaceManagerVisible="true"
      :style="editorStyle"
    />
  </div>
</template>
