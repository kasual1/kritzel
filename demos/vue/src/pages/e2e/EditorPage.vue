<script setup lang="ts">
import { KritzelEditor } from 'kritzel-vue'
import { vueThemeLight } from '../../const/vue-theme-light'
</script>

<template>
  <main>
    <KritzelEditor theme="vue-theme" :themes="[vueThemeLight]" />
  </main>
</template>

<style scoped></style>
