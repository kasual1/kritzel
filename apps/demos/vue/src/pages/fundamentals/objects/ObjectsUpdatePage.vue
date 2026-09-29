<script setup lang="ts">
import {
  getEditorRef,
  KritzelEditor,
  KritzelWorkspace,
  type KritzelBaseObject,
} from '@kritzel/vue-editor'
import { ref } from 'vue'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import { editorStyle, hostStyle } from '../../shared/demo-shared'
import Toolbar from '../../../components/Toolbar.vue'
import InfoPanel from '../../../components/InfoPanel.vue'
import InfoPanelToggle from '../../../components/InfoPanelToggle.vue'
import { useInfoPanel } from '../../../components/info-panel'

const infoPanel = useInfoPanel({ hasToolbarToggle: true })

const editor = getEditorRef('editor')
const selected = ref<KritzelBaseObject | null>(null)
const selectionCount = ref(0)
const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]

async function refreshSelection() {
  const selection = (await editor.value?.getSelectedObjects()) ?? []
  selected.value = selection[0] ?? null
  selectionCount.value = selection.length
}

async function selectFirst() {
  const all = (await editor.value?.getAllObjects()) ?? []
  if (all[0]) {
    await editor.value?.selectObjects([all[0]])
  }
}

async function moveRight() {
  const object = selected.value
  if (!object) {
    return
  }

  const updated = await editor.value?.updateObject(object, {
    translateX: object.translateX + 40,
  })
  if (updated) {
    await editor.value?.selectObjects([updated])
  }
}

async function rotate() {
  const object = selected.value
  if (!object) {
    return
  }

  const updated = await editor.value?.updateObject(object, {
    rotation: (object.rotation + 15) % 360,
  })
  if (updated) {
    await editor.value?.selectObjects([updated])
  }
}

async function toggleOpacity() {
  const object = selected.value
  if (!object) {
    return
  }

  const updated = await editor.value?.updateObject(object, {
    opacity: object.opacity === 1 ? 0.4 : 1,
  })
  if (updated) {
    await editor.value?.selectObjects([updated])
  }
}
</script>

<template>
  <div :style="hostStyle">
    <Toolbar>
      <button @click="selectFirst">Select Object</button>
      <span class="separator" />
      <button :disabled="selectionCount !== 1" @click="moveRight">
        Move Right
      </button>
      <button :disabled="selectionCount !== 1" @click="rotate">
        Rotate 15°
      </button>
      <button :disabled="selectionCount !== 1" @click="toggleOpacity">
        Toggle Opacity
      </button>
      <InfoPanelToggle :panel="infoPanel" />
    </Toolbar>
    <div class="content">
      <KritzelEditor
        ref="editor"
        editorId="objects-update"
        theme="light"
        :themes="themes"
        :workspaces="workspaces"
        :isPanningEnabled="false"
        :isZoomingEnabled="false"
        :isMoreMenuVisible="false"
        :isWorkspaceManagerVisible="false"
        :style="editorStyle"
        @isReady="refreshSelection"
        @objectsSelectionChange="refreshSelection"
      />
      <InfoPanel :panel="infoPanel" width="180px">
        <h3>Object</h3>
        <ul v-if="selected">
          <li><span class="label">translateX</span><span class="value">{{ selected.translateX.toFixed(0) }}</span></li>
          <li><span class="label">translateY</span><span class="value">{{ selected.translateY.toFixed(0) }}</span></li>
          <li><span class="label">rotation</span><span class="value">{{ selected.rotation.toFixed(0) }}</span></li>
          <li><span class="label">opacity</span><span class="value">{{ selected.opacity.toFixed(1) }}</span></li>
        </ul>
        <p v-else class="empty">Nothing selected</p>
      </InfoPanel>
    </div>
  </div>
</template>

<style scoped>
.separator {
  width: 1px;
  height: 24px;
  background: #d9d9d9;
}

.content {
  display: flex;
  flex: 1;
  min-height: 0;
}

ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

li {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid #eee;
}

.label {
  color: #333;
  font-weight: 500;
}

.value {
  color: #999;
  font-family: monospace;
  font-size: 11px;
}

.empty {
  color: #999;
  font-style: italic;
}
</style>