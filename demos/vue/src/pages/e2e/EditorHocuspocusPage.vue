<script setup lang="ts">
import { HocuspocusSyncProvider, KritzelEditor } from 'kritzel-vue'
import { vueThemeLight } from '../../const/vue-theme-light'
import { vueThemeDark } from '../../const/vue-theme-dark'

const syncConfig = {
  providers: [HocuspocusSyncProvider.with({ url: 'wss://your-hocuspocus-server.com' })],
}
</script>

<template>
  <main>
    <KritzelEditor
      theme="light"
      :themes="[vueThemeLight, vueThemeDark]"
      :syncConfig="syncConfig"
    />
  </main>
</template>

<style scoped></style>