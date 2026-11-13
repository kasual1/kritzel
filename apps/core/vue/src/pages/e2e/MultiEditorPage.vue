<script setup lang="ts">
import { UpdrawEditor } from '@updraw/vue-editor'
import { vueThemeLight } from '../../const/vue-theme-light'
</script>

<template>
  <div class="multi-editor-host">
    <div class="editor-container editor-container-first">
      <UpdrawEditor id="editor-1" editor-id="e2e-editor-1" theme="light" :themes="[vueThemeLight]" />
    </div>
    <div class="editor-container editor-container-second">
      <UpdrawEditor id="editor-2" editor-id="e2e-editor-2" theme="light" :themes="[vueThemeLight]" />
    </div>
  </div>
</template>

<style scoped>
.multi-editor-host {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  padding: 24px;
  box-sizing: border-box;
  height: 100%;
  width: 100%;
  background: linear-gradient(135deg, #f7f8fb, #fef6f7);
}

.editor-container {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  background: #ffffff;
}

.editor-container-first {
  border: 2px solid #3f7ac8;
}

.editor-container-second {
  border: 2px solid #d65067;
}

.editor-container :deep(updraw-editor) {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
