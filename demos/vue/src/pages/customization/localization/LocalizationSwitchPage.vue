<script setup lang="ts">
import { ref } from 'vue'
import { KritzelEditor, KritzelWorkspace, type LocaleCode } from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import { editorStyle, hostStyle } from '../../shared/demo-shared'
import Toolbar from '../../../components/Toolbar.vue'

const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]
const activeLocale = ref<LocaleCode>('en')

function onLocaleChange(event: CustomEvent<LocaleCode>) {
  activeLocale.value = event.detail
}
</script>

<template>
  <div :style="hostStyle">
    <Toolbar>
      <button :class="{ active: activeLocale === 'en' }" @click="activeLocale = 'en'">English</button>
      <button :class="{ active: activeLocale === 'de' }" @click="activeLocale = 'de'">German</button>
      <button :class="{ active: activeLocale === 'fr' }" @click="activeLocale = 'fr'">French</button>
    </Toolbar>
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
