<script setup lang="ts">
import { KritzelEditor, type KritzelFontMap } from '@kritzel/vue-editor'
import { vueThemeLight } from '../../../const/vue-theme-light'

const fonts: KritzelFontMap = {
  pacifico: { family: 'Pacifico', label: 'Pacifico Cursive', cssFontFamily: "'Pacifico', cursive", source: 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap' },
  'fira-code': { family: 'Fira Code', label: 'Fira Code Monospace', cssFontFamily: "'Fira Code', monospace", source: 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;700&display=swap' },
  'space-grotesk': { family: 'Space Grotesk', label: 'Space Grotesk Sans', cssFontFamily: "'Space Grotesk', sans-serif", source: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&display=swap' },
}
</script>

<template>
  <div class="page">
    <div class="toolbar">Custom Fonts: Pacifico, Fira Code, Space Grotesk</div>
    <KritzelEditor editorId="fonts-register" :customFonts="fonts" theme="light" :themes="[vueThemeLight]" :isPanningEnabled="false" :isZoomingEnabled="false" :isMoreMenuVisible="true" />
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; height: 100vh; font-family: sans-serif; }
.toolbar { padding: 8px; background: #f5f5f5; border-bottom: 1px solid #ddd; }
KritzelEditor { flex: 1; min-height: 0; }
</style>
