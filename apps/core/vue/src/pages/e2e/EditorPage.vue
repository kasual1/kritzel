<script setup lang="ts">
import { UpdrawEditor } from '@updraw/vue-editor'
import { vueThemeLight } from '../../const/vue-theme-light'
import { vueThemeDark } from '../../const/vue-theme-dark'
</script>

<template>
  <main>
    <UpdrawEditor theme="light" :themes="[vueThemeLight, vueThemeDark]" />
  </main>
</template>

<style scoped></style>
