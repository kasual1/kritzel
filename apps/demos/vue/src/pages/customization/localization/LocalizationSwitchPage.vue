<script setup lang="ts">
import { ref } from 'vue'
import { KritzelEditor } from '@kritzel/vue-editor'
import { vueThemeLight } from '../../../const/vue-theme-light'

const locale = ref('en')
</script>

<template>
  <div class="page">
    <div class="toolbar">
      <strong>Locale:</strong>
      <button v-for="item in [['en', 'English'], ['de', 'German'], ['fr', 'French']]" :key="item[0]" @click="locale = item[0]">{{ item[1] }} ({{ item[0] }})</button>
    </div>
    <KritzelEditor editorId="localization-switch" :locale="locale" theme="light" :themes="[vueThemeLight]" :isPanningEnabled="false" :isZoomingEnabled="false" :isMoreMenuVisible="true" :isWorkspaceManagerVisible="true" @localeChange="locale = $event.detail" />
    <div class="status">Active Locale: {{ locale }}</div>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; height: 100vh; font-family: sans-serif; }
.toolbar, .status { padding: 8px; background: #f5f5f5; border-bottom: 1px solid #ddd; display: flex; gap: 8px; }
.status { border-top: 1px solid #ddd; border-bottom: 0; font-family: monospace; }
KritzelEditor { flex: 1; min-height: 0; }
</style>
