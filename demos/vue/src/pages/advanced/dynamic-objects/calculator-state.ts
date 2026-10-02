export type CalculatorOperator = 'add' | 'subtract' | 'multiply' | 'divide'

export interface CalculatorState {
  displayValue: string
  storedValue: number | null
  pendingOperator: CalculatorOperator | null
  shouldReplaceDisplay: boolean
}

const defaultCalculatorState: CalculatorState = {
  displayValue: '0',
  storedValue: null,
  pendingOperator: null,
  shouldReplaceDisplay: true,
}

export const calculatorOperatorLabels: Record<CalculatorOperator, string> = {
  add: '+',
  subtract: '-',
  multiply: 'x',
  divide: '/',
}

export function createCalculatorInitialState(): CalculatorState {
  return { ...defaultCalculatorState }
}

export function normalizeCalculatorState(data: unknown): CalculatorState {
  if (!data || typeof data !== 'object') {
    return createCalculatorInitialState()
  }

  const state = data as Partial<CalculatorState>
  return {
    displayValue:
      typeof state.displayValue === 'string' && Number.isFinite(Number(state.displayValue))
        ? state.displayValue
        : defaultCalculatorState.displayValue,
    storedValue:
      typeof state.storedValue === 'number' && Number.isFinite(state.storedValue)
        ? state.storedValue
        : defaultCalculatorState.storedValue,
    pendingOperator:
      state.pendingOperator && state.pendingOperator in calculatorOperatorLabels
        ? state.pendingOperator
        : defaultCalculatorState.pendingOperator,
    shouldReplaceDisplay:
      typeof state.shouldReplaceDisplay === 'boolean'
        ? state.shouldReplaceDisplay
        : defaultCalculatorState.shouldReplaceDisplay,
  }
}

export function runCalculatorOperation(
  leftValue: number,
  rightValue: number,
  operator: CalculatorOperator,
): number {
  switch (operator) {
    case 'add':
      return leftValue + rightValue
    case 'subtract':
      return leftValue - rightValue
    case 'multiply':
      return leftValue * rightValue
    case 'divide':
      return rightValue === 0 ? 0 : leftValue / rightValue
  }
}

export function formatCalculatorNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')
}