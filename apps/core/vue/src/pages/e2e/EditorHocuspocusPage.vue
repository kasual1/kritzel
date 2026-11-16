<script setup lang="ts">
import { HocuspocusSyncProvider, UpmadeEditor } from '@upmade/vue-editor'
import { vueThemeLight } from '../../const/vue-theme-light'
import { vueThemeDark } from '../../const/vue-theme-dark'

const syncConfig = {
  providers: [HocuspocusSyncProvider.with({ url: 'wss://your-hocuspocus-server.com', connectionTimeout: 2000 })],
}
</script>

<template>
  <main>
    <UpmadeEditor
      theme="light"
      :themes="[vueThemeLight, vueThemeDark]"
      :syncConfig="syncConfig"
    />
  </main>
</template>

<style scoped></style>
