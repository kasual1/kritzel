<script setup lang="ts">
import { UpmadeEditor } from '@upmade/vue-editor'
import { vueThemeLight } from '../../const/vue-theme-light'
import { vueThemeDark } from '../../const/vue-theme-dark'
</script>

<template>
  <main>
    <UpmadeEditor theme="light" :themes="[vueThemeLight, vueThemeDark]" />
  </main>
</template>

<style scoped></style>
