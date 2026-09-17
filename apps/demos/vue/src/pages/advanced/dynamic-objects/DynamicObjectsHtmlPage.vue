<script setup lang="ts">
import { ref } from 'vue'
import { getEditorRef, KritzelDynamicObject, KritzelEditor, type HTMLKritzelEditorElement } from '@kritzel/vue-editor'
import { vueThemeLight } from '../../../const/vue-theme-light'

const editor = getEditorRef('editor')
const hasAddedInitialDynamicObject = ref(false)

function createHtmlCounterElement(): HTMLElement {
  const root = document.createElement('section')
  root.style.cssText = 'display:flex;flex-direction:column;gap:10px;padding:14px;box-sizing:border-box;height:100%;font-family:sans-serif;'

  const heading = document.createElement('h3')
  heading.textContent = 'Native HTML Counter'
  heading.style.cssText = 'margin:0;font-size:15px;'

  const note = document.createElement('p')
  note.textContent = 'This content is plain DOM passed directly as the element, with no renderer.'
  note.style.cssText = 'margin:0;font-size:12px;color:#555;'

  const controls = document.createElement('div')
  controls.style.cssText = 'display:flex;align-items:center;gap:12px;margin-top:auto;'

  const decrementButton = document.createElement('button')
  decrementButton.type = 'button'
  decrementButton.textContent = '-'

  const countLabel = document.createElement('span')
  countLabel.style.cssText = 'font-size:20px;font-weight:700;min-width:24px;text-align:center;'

  const incrementButton = document.createElement('button')
  incrementButton.type = 'button'
  incrementButton.textContent = '+'

  ;[decrementButton, incrementButton].forEach((button) => {
    button.style.cssText =
      'width:32px;height:32px;border-radius:6px;border:1px solid #42b883;background:#ffffff;color:#1f2937;cursor:pointer;font-size:16px;'
  })

  let count = 0
  const renderCount = () => {
    countLabel.textContent = String(count)
  }
  renderCount()

  incrementButton.addEventListener('click', () => {
    count += 1
    renderCount()
  })
  decrementButton.addEventListener('click', () => {
    count -= 1
    renderCount()
  })

  controls.appendChild(decrementButton)
  controls.appendChild(countLabel)
  controls.appendChild(incrementButton)

  root.appendChild(heading)
  root.appendChild(note)
  root.appendChild(controls)

  return root
}

async function onReady() {
  const editorValue = editor.value as HTMLKritzelEditorElement | undefined
  if (!editorValue || hasAddedInitialDynamicObject.value) {
    return
  }

  const objectCount = await editorValue.getObjectsTotalCount()
  if (objectCount > 0) {
    return
  }

  hasAddedInitialDynamicObject.value = true

  const dynamicObject = new KritzelDynamicObject({
    element: createHtmlCounterElement(),
    translateX: -150,
    translateY: -90,
    width: 260,
    height: 160,
  })

  dynamicObject.isRotatable = false

  await editorValue.addObject(dynamicObject)
}
</script>

<template>
  <div class="page">
    <div class="toolbar">
      <strong>Native HTML:</strong>
      <span>The object mounts a plain DOM element with no renderer registered.</span>
    </div>
    <KritzelEditor
      ref="editor"
      editorId="dynamic-objects-html"
      theme="light"
      :themes="[vueThemeLight]"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      @isReady="onReady"
    />
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; height: 100vh; }
.toolbar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #ebebeb; font: 13px sans-serif; }
.toolbar strong { color: #42b883; }
KritzelEditor { flex: 1; min-height: 0; }
</style>
