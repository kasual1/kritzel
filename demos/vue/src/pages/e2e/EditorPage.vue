<script setup lang="ts">
import { KritzelEditor } from 'kritzel-vue'
import { vueThemeLight } from '../../const/vue-theme-light'
import { vueThemeDark } from '../../const/vue-theme-dark'
</script>

<template>
  <main>
    <KritzelEditor theme="vue-theme" :themes="[vueThemeLight, vueThemeDark]" />
  </main>
</template>

<style scoped></style>
