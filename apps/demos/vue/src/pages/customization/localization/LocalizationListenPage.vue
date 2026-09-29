<script setup lang="ts">
import { ref } from 'vue'
import { KritzelEditor, KritzelWorkspace, type LocaleCode } from '@kritzel/vue-editor'
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
const activeLocale = ref<LocaleCode>('en')
const localeHistory = ref<LocaleCode[]>([])

function applyLocale(locale: LocaleCode) {
  activeLocale.value = locale
  if (localeHistory.value.at(-1) !== locale) localeHistory.value.push(locale)
}

function onLocaleChange(event: CustomEvent<LocaleCode>) {
  applyLocale(event.detail)
}
</script>

<template>
  <div :style="hostStyle">
    <Toolbar>
      <button :class="{ active: activeLocale === 'en' }" @click="applyLocale('en')">English</button>
      <button :class="{ active: activeLocale === 'de' }" @click="applyLocale('de')">German</button>
      <button :class="{ active: activeLocale === 'fr' }" @click="applyLocale('fr')">French</button>
      <InfoPanelToggle :panel="infoPanel" />
    </Toolbar>
    <div class="content">
      <KritzelEditor
        editorId="localization-listen"
        :locale="activeLocale"
        :workspaces="workspaces"
        theme="light"
        :themes="themes"
        :isPanningEnabled="false"
        :isZoomingEnabled="false"
        :isMoreMenuVisible="true"
        :isWorkspaceManagerVisible="true"
        :style="editorStyle"
        @isReady="applyLocale('en')"
        @localeChange="onLocaleChange"
      />
      <InfoPanel :panel="infoPanel" width="220px">
        <h3>Locale changes</h3>
        <ul>
          <li v-for="(locale, index) in localeHistory" :key="`${index}-${locale}`">{{ locale }}</li>
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