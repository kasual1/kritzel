<script setup lang="ts">
import { ref } from 'vue'
import { KritzelEditor, KritzelWorkspace } from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import { editorStyle, hostStyle } from '../../shared/demo-shared'
import Toolbar from '../../../components/Toolbar.vue'
import InfoPanel from '../../../components/InfoPanel.vue'
import InfoPanelToggle from '../../../components/InfoPanelToggle.vue'
import { useInfoPanel } from '../../../components/info-panel'

const infoPanel = useInfoPanel({ hasToolbarToggle: true })

const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]
const activeTheme = ref('light')
const themeHistory = ref<string[]>([])

function applyTheme(theme: string) {
  activeTheme.value = theme
  if (themeHistory.value.at(-1) !== theme) themeHistory.value.push(theme)
}

function onThemeChange(event: CustomEvent<string>) {
  applyTheme(event.detail)
}
</script>

<template>
  <div :style="hostStyle">
    <Toolbar>
      <button :class="{ active: activeTheme === 'light' }" @click="applyTheme('light')">Light</button>
      <button :class="{ active: activeTheme === 'dark' }" @click="applyTheme('dark')">Dark</button>
      <InfoPanelToggle :panel="infoPanel" />
    </Toolbar>
    <div class="content">
      <KritzelEditor
        editorId="theming-listen"
        :theme="activeTheme"
        :themes="themes"
        :workspaces="workspaces"
        :isPanningEnabled="false"
        :isZoomingEnabled="false"
        :isMoreMenuVisible="true"
        :isWorkspaceManagerVisible="true"
        :style="editorStyle"
        @isReady="applyTheme('light')"
        @themeChange="onThemeChange"
      />
      <InfoPanel :panel="infoPanel" width="220px">
        <h3>Theme changes</h3>
        <ul>
          <li v-for="(theme, index) in themeHistory" :key="`${index}-${theme}`">{{ theme }}</li>
        </ul>
      </InfoPanel>
    </div>
  </div>
</template>

<style scoped>
.content { display: flex; flex: 1; min-height: 0; }
ul { display: flex; flex-direction: column; gap: 8px; margin: 0; padding: 0; list-style: none; }
li { padding: 6px 8px; border: 1px solid #e5e7eb; border-radius: 4px; background: #f9fafb; font: 12px monospace; }
</style>