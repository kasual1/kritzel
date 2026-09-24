<script setup lang="ts">
import { ref } from 'vue'
import { KritzelEditor, KritzelWorkspace, type KritzelLocale, type LocaleCode } from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import { buttonStyle, editorStyle, hostStyle, toolbarStyle } from '../../shared/demo-shared'

const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]
const spanishLocale: KritzelLocale = {
  code: 'es',
  label: 'Espanol',
  terms: {
    'menu.copy': 'Copiar',
    'menu.cut': 'Cortar',
    'menu.paste': 'Pegar',
    'menu.delete': 'Eliminar',
    'menu.settings': 'Configuracion',
    'menu.share': 'Compartir',
    'settings.dialogTitle': 'Configuracion del editor',
    'zoom.zoomIn': 'Acercar',
    'zoom.zoomOut': 'Alejar',
    'utility.undo': 'Deshacer',
    'utility.redo': 'Rehacer',
  },
}
const customLocales = [spanishLocale]
const activeLocale = ref<LocaleCode>('es')
</script>

<template>
  <div :style="hostStyle">
    <div :style="toolbarStyle">
      <button :style="buttonStyle(activeLocale === 'es')" @click="activeLocale = 'es'">Espanol</button>
    </div>
    <KritzelEditor
      editorId="localization-custom"
      :locales="customLocales"
      :locale="activeLocale"
      :workspaces="workspaces"
      theme="light"
      :themes="themes"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="true"
      :isWorkspaceManagerVisible="true"
      :style="editorStyle"
    />
  </div>
</template>
