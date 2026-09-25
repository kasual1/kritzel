import { KritzelDynamicObject } from '@kritzel/vue-editor'
import {
  calculatorOperatorLabels,
  createCalculatorInitialState,
  formatCalculatorNumber,
  normalizeCalculatorState,
  runCalculatorOperation,
  type CalculatorOperator,
  type CalculatorState,
} from './calculator-state'

export const HTML_CALCULATOR_RENDERER_KEY = 'vue-dynamic-object-html-calculator'

export interface HtmlCalculatorInstance {
  element: HTMLElement
  destroy(): void
  getState(): CalculatorState
}

export function createHtmlCalculator(initialState: CalculatorState): HtmlCalculatorInstance {
  const root = document.createElement('section')
  root.setAttribute('aria-label', 'HTML calculator')
  root.style.cssText = 'display:grid;grid-template-rows:auto 42px 1fr;gap:8px;height:100%;padding:14px;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 12px 32px rgba(32,33,36,.12);box-sizing:border-box;overflow:hidden;background:#fff;font-family:Roboto,sans-serif'

  const header = document.createElement('header')
  header.style.cssText = 'display:flex;align-items:center;justify-content:space-between'
  const heading = document.createElement('h3')
  heading.textContent = 'HTML Calculator'
  heading.style.cssText = 'margin:0;font-size:16px'
  const operatorLabel = document.createElement('strong')
  operatorLabel.style.color = '#42b883'
  header.append(heading, operatorLabel)

  const display = document.createElement('output')
  display.setAttribute('aria-live', 'polite')
  display.style.cssText = 'display:flex;align-items:center;justify-content:flex-end;padding:0 12px;border:1px solid #e0e0e0;border-radius:6px;background:#fafafa;font-size:24px;font-weight:700;overflow:hidden'

  const keypad = document.createElement('div')
  keypad.style.cssText = 'display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:repeat(5,minmax(0,1fr));gap:6px;min-height:0'

  let state = normalizeCalculatorState(initialState)
  const cleanupCallbacks: Array<() => void> = []
  const render = () => {
    display.textContent = state.displayValue
    operatorLabel.textContent = state.pendingOperator
      ? calculatorOperatorLabels[state.pendingOperator]
      : ''
  }
  const currentValue = () => {
    const value = Number(state.displayValue)
    return Number.isFinite(value) ? value : 0
  }
  const appendDigit = (digit: string) => {
    state.displayValue = state.shouldReplaceDisplay
      ? digit
      : state.displayValue === '0'
        ? digit
        : `${state.displayValue}${digit}`
    state.shouldReplaceDisplay = false
    render()
  }
  const appendDecimal = () => {
    if (state.shouldReplaceDisplay) {
      state.displayValue = '0.'
      state.shouldReplaceDisplay = false
    } else if (!state.displayValue.includes('.')) {
      state.displayValue += '.'
    }
    render()
  }
  const chooseOperator = (operator: CalculatorOperator) => {
    state.storedValue = state.pendingOperator && state.storedValue !== null
      ? runCalculatorOperation(state.storedValue, currentValue(), state.pendingOperator)
      : currentValue()
    state.pendingOperator = operator
    state.shouldReplaceDisplay = true
    render()
  }
  const calculate = () => {
    if (state.storedValue === null || !state.pendingOperator) {
      return
    }
    state.displayValue = formatCalculatorNumber(
      runCalculatorOperation(state.storedValue, currentValue(), state.pendingOperator),
    )
    state.storedValue = null
    state.pendingOperator = null
    state.shouldReplaceDisplay = true
    render()
  }
  const clear = () => {
    state = createCalculatorInitialState()
    render()
  }
  const addButton = (label: string, onClick: () => void, accent = false, span = false) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = label
    button.style.cssText = `min-width:0;min-height:0;border:1px solid ${accent ? '#42b883' : '#dadce0'};border-radius:6px;background:${label === '=' ? '#42b883' : '#fff'};color:${label === '=' ? '#fff' : accent ? '#167a55' : '#202124'};cursor:pointer;font-weight:600${span ? ';grid-column:span 2' : ''}${label === '=' ? ';grid-row:span 2' : ''}`
    button.addEventListener('click', onClick)
    cleanupCallbacks.push(() => button.removeEventListener('click', onClick))
    keypad.appendChild(button)
  }

  addButton('C', clear)
  addButton('/', () => chooseOperator('divide'), true)
  addButton('x', () => chooseOperator('multiply'), true)
  addButton('-', () => chooseOperator('subtract'), true)
  ;['7', '8', '9'].forEach((digit) => addButton(digit, () => appendDigit(digit)))
  addButton('+', () => chooseOperator('add'), true)
  ;['4', '5', '6'].forEach((digit) => addButton(digit, () => appendDigit(digit)))
  addButton('=', calculate, true)
  ;['1', '2', '3'].forEach((digit) => addButton(digit, () => appendDigit(digit)))
  addButton('0', () => appendDigit('0'), false, true)
  addButton('.', appendDecimal)

  render()
  root.append(header, display, keypad)
  return {
    element: root,
    destroy: () => cleanupCallbacks.forEach((cleanup) => cleanup()),
    getState: () => ({ ...state }),
  }
}

export function createHtmlCalculatorObject(): KritzelDynamicObject {
  const placeholder = document.createElement('div')
  placeholder.textContent = 'Loading Calculator...'
  const object = new KritzelDynamicObject({
    element: placeholder,
    rendererKey: HTML_CALCULATOR_RENDERER_KEY,
    rendererData: createCalculatorInitialState(),
    translateX: -130,
    translateY: -190,
    width: 260,
    height: 320,
  })
  object.isRotatable = false
  return object
}