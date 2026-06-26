<script setup lang="ts">
import { computed, ref, watch } from 'vue'

type TodoItem = {
  id: number
  title: string
  isCompleted: boolean
}

type TodoListState = {
  todos: TodoItem[]
  nextId: number
}

function cloneTodoListState(state: TodoListState): TodoListState {
  return {
    nextId: state.nextId,
    todos: state.todos.map((todo) => ({ ...todo })),
  }
}

const props = defineProps<{
  initialState?: TodoListState
  onStateChange?: (state: TodoListState) => void
}>()

const fallbackState: TodoListState = {
  nextId: 1,
  todos: [],
}

const startingState = cloneTodoListState(props.initialState ?? fallbackState)

const todos = ref<TodoItem[]>(startingState.todos)
const nextId = ref<number>(startingState.nextId)
const newTodo = ref('')
const editingId = ref<number | null>(null)
const editValue = ref('')

const totalCount = computed(() => todos.value.length)
const doneCount = computed(() => todos.value.filter((todo) => todo.isCompleted).length)
const openCount = computed(() => totalCount.value - doneCount.value)

watch(
  [todos, nextId],
  () => {
    props.onStateChange?.({
      nextId: nextId.value,
      todos: todos.value.map((todo) => ({ ...todo })),
    })
  },
  { deep: true, immediate: true },
)

function addTodo() {
  const title = newTodo.value.trim()
  if (!title) {
    return
  }

  const id = nextId.value
  todos.value = [...todos.value, { id, title, isCompleted: false }]
  nextId.value += 1
  newTodo.value = ''
}

function toggleTodo(todoId: number) {
  todos.value = todos.value.map((todo) =>
    todo.id === todoId ? { ...todo, isCompleted: !todo.isCompleted } : todo,
  )
}

function deleteTodo(todoId: number) {
  todos.value = todos.value.filter((todo) => todo.id !== todoId)
  if (editingId.value === todoId) {
    cancelEdit()
  }
}

function startEdit(todo: TodoItem) {
  editingId.value = todo.id
  editValue.value = todo.title
}

function cancelEdit() {
  editingId.value = null
  editValue.value = ''
}

function saveEdit(todoId: number) {
  const title = editValue.value.trim()
  if (!title) {
    return
  }

  todos.value = todos.value.map((todo) =>
    todo.id === todoId ? { ...todo, title } : todo,
  )
  cancelEdit()
}
</script>

<template>
  <section class="todo-card">
    <header>
      <h1>Todo List</h1>
      <p>Simple Vue CRUD inside a Kritzel custom element</p>
    </header>

    <form class="create-form" @submit.prevent="addTodo">
      <label for="vue-custom-element-new-todo" class="sr-only">New todo</label>
      <input
        id="vue-custom-element-new-todo"
        v-model="newTodo"
        type="text"
        placeholder="Add a new task"
      />
      <button type="submit" :disabled="newTodo.trim().length === 0">Add</button>
    </form>

    <section class="stats" aria-live="polite">
      <span>Total: {{ totalCount }}</span>
      <span>Open: {{ openCount }}</span>
      <span>Done: {{ doneCount }}</span>
    </section>

    <p v-if="todos.length === 0" class="empty">No todos yet. Add your first task above.</p>

    <ul v-else class="todo-list">
      <li
        v-for="todo in todos"
        :key="todo.id"
        class="todo-item"
        :class="{ completed: todo.isCompleted }"
      >
        <form v-if="editingId === todo.id" class="edit-form" @submit.prevent="saveEdit(todo.id)">
          <label :for="`vue-custom-element-edit-${todo.id}`" class="sr-only">Edit todo</label>
          <input :id="`vue-custom-element-edit-${todo.id}`" v-model="editValue" type="text" />
          <div class="actions">
            <button type="submit" :disabled="editValue.trim().length === 0">Save</button>
            <button type="button" @click="cancelEdit">Cancel</button>
          </div>
        </form>

        <div v-else class="view-row">
          <label class="checkbox-row">
            <input type="checkbox" :checked="todo.isCompleted" @change="toggleTodo(todo.id)" />
            <span>{{ todo.title }}</span>
          </label>
          <div class="actions">
            <button type="button" @click="startEdit(todo)">Edit</button>
            <button type="button" @click="deleteTodo(todo.id)">Delete</button>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>

<style>
.todo-card {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  border: 1px solid #d5dbe8;
  border-radius: 16px;
  padding: 20px;
  background: #ffffff;
  overflow: auto;
  font-family: Roboto, sans-serif;
}

h1 {
  margin: 0;
  font-size: 2rem;
  color: #1b2440;
}

header p {
  margin: 4px 0 0;
  color: #4c5775;
}

.create-form {
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}

input[type='text'] {
  width: 100%;
  border: 1px solid #bfc8dc;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.98rem;
  box-sizing: border-box;
}

button {
  border: 1px solid #245f8f;
  border-radius: 10px;
  padding: 10px 14px;
  font-weight: 600;
  color: #ffffff;
  background: #2b73ad;
  cursor: pointer;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.stats {
  margin-top: 14px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  color: #334268;
  font-size: 0.92rem;
}

.empty {
  margin: 18px 0 0;
  color: #4f5b7b;
}

.todo-list {
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 10px;
}

.todo-item {
  border: 1px solid #d7deee;
  border-radius: 12px;
  padding: 10px;
  background: #fbfcff;
}

.todo-item.completed .view-row span {
  text-decoration: line-through;
  color: #67718f;
}

.view-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.checkbox-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.actions {
  display: inline-flex;
  gap: 6px;
}

.actions button {
  padding: 7px 10px;
}

.edit-form {
  display: grid;
  gap: 8px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

@media (max-width: 640px) {
  .todo-card {
    padding: 14px;
  }

  .view-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
