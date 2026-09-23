<script setup lang="ts">
import { ref } from 'vue'
import { KritzelEditor, type KritzelLocale } from '@kritzel/vue-editor'
import { vueThemeLight } from '../../../const/vue-theme-light'

const locale = ref('es')
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
</script>

<template>
  <div class="page">
    <div class="toolbar">
      <strong>Custom Locale:</strong>
      <button @click="locale = 'es'">Espanol (es)</button>
      <button @click="locale = 'en'">English (en)</button>
    </div>
    <KritzelEditor editorId="localization-custom" :locales="[spanishLocale]" :locale="locale" theme="light" :themes="[vueThemeLight]" :isPanningEnabled="false" :isZoomingEnabled="false" :isMoreMenuVisible="true" :isWorkspaceManagerVisible="true" />
    <div class="status">Active Locale: {{ locale }}</div>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; height: 100vh; font-family: sans-serif; }
.toolbar, .status { padding: 8px; background: #f5f5f5; border-bottom: 1px solid #ddd; display: flex; gap: 8px; }
.status { border-top: 1px solid #ddd; border-bottom: 0; font-family: monospace; }
KritzelEditor { flex: 1; min-height: 0; }
</style>
