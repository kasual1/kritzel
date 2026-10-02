<script setup lang="ts">
import type { InfoPanelController } from './info-panel'

const props = defineProps<{ panel: InfoPanelController }>()
</script>

<template>
  <button
    class="info-panel-toolbar-toggle"
    :class="{ 'show-on-mobile': props.panel.showOnMobile }"
    type="button"
    :aria-controls="props.panel.panelId"
    :aria-expanded="props.panel.isOpen"
    aria-label="Toggle info panel"
    @click="props.panel.toggle()"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.25"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  </button>
</template>

<!-- Unscoped and nested under .demo-toolbar so these win over the generic toolbar button styles. -->
<style>
.demo-toolbar:has(> .info-panel-toolbar-toggle) {
  padding-right: 52px;
}

.demo-toolbar > .info-panel-toolbar-toggle {
  position: absolute;
  top: 8px;
  right: 12px;
  display: none;
  box-sizing: border-box;
  width: 29px;
  height: 29px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  color: #333;
  cursor: pointer;
}

.demo-toolbar > .info-panel-toolbar-toggle:hover,
.demo-toolbar > .info-panel-toolbar-toggle:focus-visible {
  border-color: #42b883;
  background: #42b883;
  color: #fff;
  outline: 0;
}

.demo-toolbar > .info-panel-toolbar-toggle:focus-visible {
  box-shadow: 0 0 0 2px rgb(66 184 131 / 25%);
}

@media (max-width: 720px) {
  .demo-toolbar > .info-panel-toolbar-toggle.show-on-mobile {
    display: inline-flex;
    z-index: 6;
  }
}
</style>
