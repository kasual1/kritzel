<script setup lang="ts">
import { ref } from 'vue'
import { KritzelEditor, KritzelWorkspace, type LocaleCode } from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import { buttonStyle, editorStyle, hostStyle, toolbarStyle } from '../../shared/demo-shared'

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
    <div :style="toolbarStyle">
      <button :style="buttonStyle(activeLocale === 'en')" @click="applyLocale('en')">English</button>
      <button :style="buttonStyle(activeLocale === 'de')" @click="applyLocale('de')">German</button>
      <button :style="buttonStyle(activeLocale === 'fr')" @click="applyLocale('fr')">French</button>
    </div>
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
      <aside>
        <h3>Locale changes</h3>
        <ul>
          <li v-for="(locale, index) in localeHistory" :key="`${index}-${locale}`">{{ locale }}</li>
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