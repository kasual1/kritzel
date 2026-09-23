<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import {
  getEditorRef,
  KritzelDynamicObject,
  KritzelEditor,
  registerVueDynamicObjectRenderer,
  type HTMLKritzelEditorElement,
} from '@kritzel/vue-editor'
import { vueThemeLight } from '../../../const/vue-theme-light.ts'
import { editorStyle, hostStyle } from '../../shared/demo-shared'
import TodoListCustomElement from './TodoListCustomElement.ce.vue'

type TodoItem = {
  id: number
  title: string
  isCompleted: boolean
}

type TodoListState = {
  todos: TodoItem[]
  nextId: number
}

const DEFAULT_TODO_STATE: TodoListState = {
  nextId: 4,
  todos: [
    { id: 1, title: 'Review project docs', isCompleted: true },
    { id: 2, title: 'Build a Vue custom element', isCompleted: false },
    { id: 3, title: 'Verify renderer rehydration', isCompleted: false },
  ],
}

function createTodoListInitialState(): TodoListState {
  return {
    nextId: DEFAULT_TODO_STATE.nextId,
    todos: DEFAULT_TODO_STATE.todos.map((todo) => ({ ...todo })),
  }
}

const TODO_RENDERER_KEY = 'vue-todo-list'

const editor = getEditorRef('customElementsEditor')
const hasAddedInitialDynamicObject = ref(false)
const unregisterTodoRenderer = registerVueDynamicObjectRenderer(TODO_RENDERER_KEY, {
  tagName: '@kritzel/vue-editor-todo-list',
  component: TodoListCustomElement,
  createInitialState: createTodoListInitialState,
})

onBeforeUnmount(() => {
  unregisterTodoRenderer()
})

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

  const placeholder = document.createElement('div')
  placeholder.textContent = 'Loading Todo List...'

  const dynamicObject = new KritzelDynamicObject({
    element: placeholder,
    rendererKey: TODO_RENDERER_KEY,
    rendererData: createTodoListInitialState(),
    translateX: -300,
    translateY: -180,
    width: 600,
    height: 380,
  })

  dynamicObject.isRotatable = false

  await editorValue.addObject(dynamicObject)
}
</script>

<template>
  <div :style="hostStyle">
    <KritzelEditor
      ref="customElementsEditor"
      editorId="vue-dynamic-objects"
      theme="light"
      :themes="[vueThemeLight]"
      :style="editorStyle"
      @isReady="onReady"
    />
  </div>
</template>
