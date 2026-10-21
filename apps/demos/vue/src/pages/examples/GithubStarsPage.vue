<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import {
  getEditorRef,
  KritzelDynamicObjectRendererRegistry,
  KritzelEditor,
  KritzelWorkspace,
  type KritzelSyncConfig,
} from '@kritzel/vue-editor'
import { vueThemeDark } from '../../const/vue-theme-dark'
import { vueThemeLight } from '../../const/vue-theme-light'
import {
  createGithubStarObjects,
  DEFAULT_STAR_COUNT,
  GITHUB_STAR_RENDERER_KEY,
  mountGithubStarButton,
  normalizeGithubStarButtonData,
  STAR_COUNTS,
  type GithubStarButtonInstance,
} from './github-star-button'

const editor = getEditorRef('editor')
const mountedButtons = new Map<string, GithubStarButtonInstance>()
const themes = [vueThemeLight, vueThemeDark]
const syncConfig: KritzelSyncConfig = { providers: [] }
const editorStyle = { display: 'block', width: '100%', height: '100%' }

const starCount = ref(DEFAULT_STAR_COUNT)
const isBusy = ref(false)

function destroyButton(objectId: string, container: HTMLElement | null): void {
  mountedButtons.get(objectId)?.destroy()
  mountedButtons.delete(objectId)
  if (container) {
    container.innerHTML = ''
  }
}

KritzelDynamicObjectRendererRegistry.register(GITHUB_STAR_RENDERER_KEY, {
  onMount: ({ object, container, data }) => {
    if (!container) {
      return
    }
    destroyButton(object.id, container)
    mountedButtons.set(object.id, mountGithubStarButton(container, normalizeGithubStarButtonData(data)))
  },
  onSerialize: ({ object, data }) =>
    mountedButtons.get(object.id)?.getData() ?? normalizeGithubStarButtonData(data),
  onUnmount: ({ object, container, data }) => {
    const state = mountedButtons.get(object.id)?.getData() ?? normalizeGithubStarButtonData(data)
    destroyButton(object.id, container)
    return state
  },
})

const workspaces = [new KritzelWorkspace({ objects: createGithubStarObjects(DEFAULT_STAR_COUNT) })]

async function changeStarCount(count: number) {
  if (!editor.value || isBusy.value || count === starCount.value) {
    return
  }

  isBusy.value = true
  try {
    await editor.value.clearSelection()
    await editor.value.removeObjects(await editor.value.getAllObjects())
    await editor.value.addObjects(createGithubStarObjects(count))
    starCount.value = count
  } finally {
    isBusy.value = false
  }
}

onBeforeUnmount(() => {
  mountedButtons.forEach((button) => button.destroy())
  mountedButtons.clear()
  KritzelDynamicObjectRendererRegistry.unregister(GITHUB_STAR_RENDERER_KEY)
})
</script>

<template>
  <div class="github-stars">
    <KritzelEditor
      ref="editor"
      editorId="examples-github-stars"
      theme="light"
      :themes="themes"
      :syncConfig="syncConfig"
      :workspaces="workspaces"
      :loginConfig="undefined"
      :isPanningEnabled="true"
      :isZoomingEnabled="true"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
    />

    <div class="count-switcher" role="group" aria-label="Number of star buttons">
      <span>Buttons</span>
      <button
        v-for="count in STAR_COUNTS"
        :key="count"
        type="button"
        :class="{ active: count === starCount }"
        :aria-pressed="count === starCount"
        :disabled="isBusy"
        @click="changeStarCount(count)"
      >
        {{ count.toLocaleString('en-US') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.github-stars {
  position: relative;
  width: 100%;
  height: 100%;
  font-family: Roboto, sans-serif;
}

.count-switcher {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border: 1px solid #ebebeb;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  color: #333333;
  font-size: 13px;
}

.count-switcher button {
  padding: 4px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #ffffff;
  color: #333333;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
}

.count-switcher button.active {
  border-color: #42b883;
  background: #42b883;
  color: #ffffff;
}
</style>
