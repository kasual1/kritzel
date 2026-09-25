<script setup lang="ts">
import { ref } from 'vue'
import { KritzelEditor, KritzelWorkspace } from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import { buttonStyle, editorStyle, hostStyle, toolbarStyle } from '../../shared/demo-shared'

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
    <div :style="toolbarStyle">
      <button :style="buttonStyle(activeTheme === 'light')" @click="applyTheme('light')">Light</button>
      <button :style="buttonStyle(activeTheme === 'dark')" @click="applyTheme('dark')">Dark</button>
    </div>
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
      <aside>
        <h3>Theme changes</h3>
        <ul>
          <li v-for="(theme, index) in themeHistory" :key="`${index}-${theme}`">{{ theme }}</li>
        </ul>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.content { display: flex; flex: 1; min-height: 0; }
aside { box-sizing: border-box; width: 220px; padding: 12px; border-left: 1px solid #e5e7eb; background: #fff; }
h3 { margin: 0 0 12px; font-size: 14px; }
ul { display: flex; flex-direction: column; gap: 8px; margin: 0; padding: 0; list-style: none; }
li { padding: 6px 8px; border: 1px solid #e5e7eb; border-radius: 4px; background: #f9fafb; font: 12px monospace; }
</style>