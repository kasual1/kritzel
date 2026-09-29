<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import { useInfoPanel, type InfoPanelController } from './info-panel'

const props = withDefaults(
  defineProps<{
    /** Pass a controller from `useInfoPanel()` when the panel is driven by an `<InfoPanelToggle>`. */
    panel?: InfoPanelController
    width?: string
    bodyPadding?: string
    contentColumn?: boolean
  }>(),
  { panel: undefined, width: undefined, bodyPadding: undefined, contentColumn: false },
)

const fallback = useInfoPanel()
const controller = computed(() => props.panel ?? fallback)

const panelStyle = computed<CSSProperties>(() => ({
  ...(props.width ? { '--demo-info-panel-width': props.width } : {}),
  ...(props.bodyPadding ? { '--demo-info-panel-body-padding': props.bodyPadding } : {}),
}))

function stopPointerEvent(event: PointerEvent) {
  event.stopPropagation()
}
</script>

<template>
  <div
    class="info-panel"
    :class="{
      'has-toolbar-toggle': controller.hasToolbarToggle,
      'show-on-mobile': controller.showOnMobile,
      'is-open': controller.isOpen,
      'info-panel-content-column': contentColumn,
    }"
    :style="panelStyle"
    @pointerdown="stopPointerEvent"
    @pointermove="stopPointerEvent"
    @pointerup="stopPointerEvent"
    @pointercancel="stopPointerEvent"
  >
    <button
      class="info-panel-toggle"
      type="button"
      :aria-controls="controller.panelId"
      :aria-expanded="controller.isOpen"
      aria-label="Toggle info panel"
      @click="controller.toggle()"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
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
    <section class="info-panel-body" :id="controller.panelId" aria-label="Demo information">
      <button
        class="info-panel-close"
        type="button"
        aria-label="Close info panel"
        @click="controller.close()"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.25"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
      <slot />
    </section>
  </div>
</template>

<!-- Unscoped so slotted panel content is styled too. -->
<style>
.info-panel {
  display: block;
  flex: 0 0 var(--demo-info-panel-width, 200px);
  width: var(--demo-info-panel-width, 200px);
  min-height: 0;
  background: #fff;
  border-left: 1px solid #ebebeb;
  font-size: 13px;
}

.info-panel > .info-panel-toggle {
  display: none;
}

.info-panel .info-panel-close {
  display: none;
}

.info-panel-body {
  box-sizing: border-box;
  height: 100%;
  overflow-y: auto;
  padding: 8px;
}

.info-panel.info-panel-content-column > .info-panel-body {
  display: flex;
  flex-direction: column;
  padding: var(--demo-info-panel-body-padding, 8px);
}

.info-panel h3 {
  margin: 0 0 8px;
  font-size: 14px;
}

@media (max-width: 720px) {
  .info-panel {
    display: none;
  }

  .info-panel.show-on-mobile {
    display: block;
    flex: 0 0 0;
    width: 0;
    min-width: 0;
    min-height: 0;
    background: transparent;
    border: 0;
    pointer-events: none;
  }

  .info-panel.show-on-mobile > .info-panel-toggle {
    position: fixed;
    top: 8px;
    right: 8px;
    z-index: 6;
    display: inline-flex;
    width: 36px;
    height: 36px;
    align-items: center;
    justify-content: center;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #fff;
    box-shadow: 0 2px 8px rgb(0 0 0 / 12%);
    cursor: pointer;
    pointer-events: auto;
  }

  .info-panel.has-toolbar-toggle > .info-panel-toggle {
    display: none;
  }

  .info-panel.show-on-mobile > .info-panel-body {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 7;
    display: block;
    width: min(360px, 100%);
    height: 100vh;
    height: 100dvh;
    margin: 0;
    padding: 52px 16px 16px;
    border: 1px solid #ebebeb;
    border-width: 0 0 0 1px;
    background: #fff;
    box-shadow: 0 8px 24px rgb(0 0 0 / 16%);
    pointer-events: auto;
    transform: translateX(100%);
    visibility: hidden;
    transition:
      transform 200ms ease-out,
      visibility 0s linear 200ms;
  }

  .info-panel.show-on-mobile .info-panel-close {
    position: absolute;
    top: 8px;
    right: 8px;
    display: inline-flex;
    width: 36px;
    height: 36px;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #fff;
    color: #333;
    cursor: pointer;
  }

  .info-panel-close:hover,
  .info-panel-close:focus-visible {
    border-color: #42b883;
    background: #42b883;
    color: #fff;
    outline: 0;
  }

  .info-panel-close:focus-visible {
    box-shadow: 0 0 0 2px rgb(66 184 131 / 25%);
  }

  .info-panel.show-on-mobile.is-open > .info-panel-body {
    transform: translateX(0);
    visibility: visible;
    transition: transform 200ms ease-out;
  }
}
</style>
