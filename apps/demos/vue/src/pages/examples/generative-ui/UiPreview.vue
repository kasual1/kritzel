<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue'

defineProps<{
  title: string
  document: string
}>()

const emit = defineEmits<{ close: [] }>()
const closeButton = useTemplateRef<HTMLButtonElement>('close')

function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  closeButton.value?.focus()
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKeyDown))
</script>

<!-- Shows a UI fullscreen, outside the canvas. -->
<template>
  <div class="ui-preview" role="dialog" aria-modal="true" :aria-label="`Preview of ${title}`">
    <div class="ui-preview__bar">
      <span>{{ title }}</span>
      <button ref="close" type="button" class="ui-preview__close" @click="emit('close')">Close <kbd>Esc</kbd></button>
    </div>
    <iframe class="ui-preview__frame" :title="title" :srcdoc="document" sandbox="allow-scripts"></iframe>
  </div>
</template>

<style scoped>
.ui-preview {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  animation: ui-preview-in 180ms ease-out;
}

@keyframes ui-preview-in {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
}

.ui-preview__bar {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 44px;
  padding: 0 8px 0 16px;
  border-bottom: 1px solid #e4e4e7;
  font-size: 14px;
  font-weight: 500;
  color: #3f3f46;
}

.ui-preview__close {
  margin-left: auto;
  height: 30px;
  padding: 0 12px;
  border: 0;
  border-radius: 8px;
  background: #f4f4f5;
  font: inherit;
  color: inherit;
  cursor: pointer;
}

.ui-preview__frame {
  flex: 1;
  width: 100%;
  border: 0;
}
</style>
