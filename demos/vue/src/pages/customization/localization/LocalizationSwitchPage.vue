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

function onLocaleChange(event: CustomEvent<LocaleCode>) {
  activeLocale.value = event.detail
}
</script>

<template>
  <div :style="hostStyle">
    <div :style="toolbarStyle">
      <button :style="buttonStyle(activeLocale === 'en')" @click="activeLocale = 'en'">English</button>
      <button :style="buttonStyle(activeLocale === 'de')" @click="activeLocale = 'de'">German</button>
      <button :style="buttonStyle(activeLocale === 'fr')" @click="activeLocale = 'fr'">French</button>
    </div>
    <KritzelEditor
      editorId="localization-switch"
      :locale="activeLocale"
      :workspaces="workspaces"
      theme="light"
      :themes="themes"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="true"
      :isWorkspaceManagerVisible="true"
      :style="editorStyle"
      @localeChange="onLocaleChange"
    />
  </div>
</template>
