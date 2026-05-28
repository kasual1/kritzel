<script setup lang="ts">
import { KritzelEditor } from 'kritzel-vue'
import { customVueTheme } from '../../const/custom-vue-theme'
</script>

<template>
  <main>
    <KritzelEditor theme="vue-theme" :themes="[customVueTheme]" />
  </main>
</template>

<style scoped></style>
