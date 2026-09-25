<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  calculatorOperatorLabels,
  createCalculatorInitialState,
  formatCalculatorNumber,
  normalizeCalculatorState,
  runCalculatorOperation,
  type CalculatorOperator,
  type CalculatorState,
} from './calculator-state'

const props = defineProps<{
  initialState?: CalculatorState
  onStateChange?: (state: CalculatorState) => void
}>()

const initialState = normalizeCalculatorState(props.initialState)
const displayValue = ref(initialState.displayValue)
const storedValue = ref(initialState.storedValue)
const pendingOperator = ref(initialState.pendingOperator)
const shouldReplaceDisplay = ref(initialState.shouldReplaceDisplay)

watch(
  [displayValue, storedValue, pendingOperator, shouldReplaceDisplay],
  () => props.onStateChange?.({
    displayValue: displayValue.value,
    storedValue: storedValue.value,
    pendingOperator: pendingOperator.value,
    shouldReplaceDisplay: shouldReplaceDisplay.value,
  }),
  { immediate: true },
)

function parseDisplayValue(): number {
  const value = Number(displayValue.value)
  return Number.isFinite(value) ? value : 0
}

function appendDigit(digit: string): void {
  displayValue.value = shouldReplaceDisplay.value
    ? digit
    : displayValue.value === '0'
      ? digit
      : `${displayValue.value}${digit}`
  shouldReplaceDisplay.value = false
}

function appendDecimal(): void {
  if (shouldReplaceDisplay.value) {
    displayValue.value = '0.'
    shouldReplaceDisplay.value = false
  } else if (!displayValue.value.includes('.')) {
    displayValue.value += '.'
  }
}

function chooseOperator(operator: CalculatorOperator): void {
  storedValue.value = pendingOperator.value && storedValue.value !== null
    ? runCalculatorOperation(storedValue.value, parseDisplayValue(), pendingOperator.value)
    : parseDisplayValue()
  pendingOperator.value = operator
  shouldReplaceDisplay.value = true
}

function calculate(): void {
  if (storedValue.value === null || !pendingOperator.value) {
    return
  }
  displayValue.value = formatCalculatorNumber(
    runCalculatorOperation(storedValue.value, parseDisplayValue(), pendingOperator.value),
  )
  storedValue.value = null
  pendingOperator.value = null
  shouldReplaceDisplay.value = true
}

function clear(): void {
  const state = createCalculatorInitialState()
  displayValue.value = state.displayValue
  storedValue.value = state.storedValue
  pendingOperator.value = state.pendingOperator
  shouldReplaceDisplay.value = state.shouldReplaceDisplay
}
</script>

<template>
  <section class="calculator-card" aria-label="Vue calculator">
    <header>
      <h3>Vue Calculator</h3>
      <strong>{{ pendingOperator ? calculatorOperatorLabels[pendingOperator] : '' }}</strong>
    </header>
    <output aria-live="polite">{{ displayValue }}</output>
    <div class="keypad">
      <button type="button" @click="clear">C</button>
      <button type="button" class="operator" @click="chooseOperator('divide')">/</button>
      <button type="button" class="operator" @click="chooseOperator('multiply')">x</button>
      <button type="button" class="operator" @click="chooseOperator('subtract')">-</button>
      <button v-for="digit in ['7', '8', '9']" :key="digit" type="button" @click="appendDigit(digit)">{{ digit }}</button>
      <button type="button" class="operator" @click="chooseOperator('add')">+</button>
      <button v-for="digit in ['4', '5', '6']" :key="digit" type="button" @click="appendDigit(digit)">{{ digit }}</button>
      <button type="button" class="equals" @click="calculate">=</button>
      <button v-for="digit in ['1', '2', '3']" :key="digit" type="button" @click="appendDigit(digit)">{{ digit }}</button>
      <button type="button" class="zero" @click="appendDigit('0')">0</button>
      <button type="button" @click="appendDecimal">.</button>
    </div>
  </section>
</template>

<style>
:host { display: block; height: 100%; min-height: 0; box-sizing: border-box; overflow: visible; container-type: size; }
.calculator-card { display: grid; grid-template-rows: auto minmax(0, 42px) minmax(0, 1fr); gap: clamp(4px, 2cqh, 10px); height: 100%; min-height: 0; padding: clamp(8px, 4cqh, 16px) clamp(6px, 3cqw, 12px); border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 12px 32px rgba(32, 33, 36, 0.12); box-sizing: border-box; overflow: hidden; font-family: Roboto, sans-serif; background: #ffffff; }
header { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 0; }
h3 { margin: 0; font-size: clamp(12px, 5cqh, 16px); line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
header strong { color: #42b883; font-size: 13px; }
output { display: flex; align-items: center; justify-content: flex-end; min-height: 0; padding: 0 12px; border: 1px solid #e0e0e0; border-radius: 6px; background: #fafafa; color: #202124; font-size: clamp(16px, 8cqh, 24px); font-weight: 700; overflow: hidden; }
.keypad { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); grid-template-rows: repeat(5, minmax(0, 1fr)); gap: clamp(4px, 1.5cqh, 6px); min-height: 0; overflow: hidden; }
button { min-width: 0; min-height: 0; border: 1px solid #dadce0; border-radius: 6px; background: #ffffff; color: #202124; cursor: var(--kritzel-global-pointer-cursor, pointer); font-size: clamp(11px, 5cqh, 15px); font-weight: 600; }
.operator { border-color: #42b883; color: #167a55; }
.equals { grid-row: span 2; background: #42b883; border-color: #42b883; color: #ffffff; }
.zero { grid-column: span 2; }
</style>