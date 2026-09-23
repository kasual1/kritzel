<script setup lang="ts">
import { ref, watch } from 'vue'

type CounterWidgetState = {
  count: number
}

const props = defineProps<{
  initialState?: CounterWidgetState
  onStateChange?: (state: CounterWidgetState) => void
}>()

const count = ref(props.initialState?.count ?? 0)

watch(count, (value) => {
  props.onStateChange?.({ count: value })
}, { immediate: true })

function increment() {
  count.value += 1
}

function decrement() {
  count.value -= 1
}
</script>

<template>
  <section class="counter-card">
    <h3>Vue Counter</h3>
    <p>This is a real, running Vue component mounted into the custom-element object.</p>
    <div class="controls">
      <button type="button" @click="decrement">-</button>
      <span class="count">{{ count }}</span>
      <button type="button" @click="increment">+</button>
    </div>
  </section>
</template>

<style scoped>
.counter-card { display: flex; flex-direction: column; gap: 10px; padding: 14px; box-sizing: border-box; height: 100%; font-family: sans-serif; }
h3 { margin: 0; font-size: 15px; }
p { margin: 0; font-size: 12px; color: #555; }
.controls { display: flex; align-items: center; gap: 12px; margin-top: auto; }
button { width: 32px; height: 32px; border-radius: 6px; border: 1px solid #42b883; background: #ffffff; color: #1f2937; cursor: pointer; font-size: 16px; }
.count { font-size: 20px; font-weight: 700; min-width: 24px; text-align: center; }
</style>
