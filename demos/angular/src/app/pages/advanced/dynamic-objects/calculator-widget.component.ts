import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal } from '@angular/core';

type CalculatorOperator = 'add' | 'subtract' | 'multiply' | 'divide';

export interface CalculatorWidgetState {
  displayValue: string;
  storedValue: number | null;
  pendingOperator: CalculatorOperator | null;
  shouldReplaceDisplay: boolean;
}

const DEFAULT_CALCULATOR_STATE: CalculatorWidgetState = {
  displayValue: '0',
  storedValue: null,
  pendingOperator: null,
  shouldReplaceDisplay: true,
};

const OPERATOR_LABELS: Record<CalculatorOperator, string> = {
  add: '+',
  subtract: '-',
  multiply: 'x',
  divide: '/',
};

export function createCalculatorWidgetInitialState(): CalculatorWidgetState {
  return { ...DEFAULT_CALCULATOR_STATE };
}

@Component({
  selector: 'app-calculator-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <section class="calculator-card" aria-label="Angular calculator">
      <div class="header">
        <h3>Angular Calculator</h3>
        @if (pendingOperator(); as operator) {
          <span>{{ operatorLabel(operator) }}</span>
        }
      </div>

      <output class="display" aria-live="polite">{{ displayValue() }}</output>

      <div class="keypad">
        <button type="button" class="muted" (click)="clear()">C</button>
        <button type="button" class="operator" (click)="chooseOperator('divide')">/</button>
        <button type="button" class="operator" (click)="chooseOperator('multiply')">x</button>
        <button type="button" class="operator" (click)="chooseOperator('subtract')">-</button>

        <button type="button" (click)="appendDigit('7')">7</button>
        <button type="button" (click)="appendDigit('8')">8</button>
        <button type="button" (click)="appendDigit('9')">9</button>
        <button type="button" class="operator" (click)="chooseOperator('add')">+</button>

        <button type="button" (click)="appendDigit('4')">4</button>
        <button type="button" (click)="appendDigit('5')">5</button>
        <button type="button" (click)="appendDigit('6')">6</button>
        <button type="button" class="equals" (click)="calculate()">=</button>

        <button type="button" (click)="appendDigit('1')">1</button>
        <button type="button" (click)="appendDigit('2')">2</button>
        <button type="button" (click)="appendDigit('3')">3</button>

        <button type="button" class="zero" (click)="appendDigit('0')">0</button>
        <button type="button" (click)="appendDecimal()">.</button>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; height: 100%; min-height: 0; box-sizing: border-box; overflow: visible; container-type: size; }
    .calculator-card { display: grid; grid-template-rows: auto minmax(0, 42px) minmax(0, 1fr); gap: clamp(4px, 2cqh, 10px); height: 100%; min-height: 0; padding: clamp(8px, 4cqh, 16px) clamp(6px, 3cqw, 12px); border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 12px 32px rgba(32, 33, 36, 0.12); box-sizing: border-box; overflow: hidden; font-family: Roboto, sans-serif; background: #ffffff; }
    .header { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 0; }
    h3 { margin: 0; font-size: clamp(12px, 5cqh, 16px); line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .header span { color: #dd0031; font-size: 13px; font-weight: 700; }
    .display { display: flex; align-items: center; justify-content: flex-end; min-height: 0; padding: 0 12px; border: 1px solid #e0e0e0; border-radius: 6px; background: #fafafa; color: #202124; font-size: clamp(16px, 8cqh, 24px); font-weight: 700; line-height: 1; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .keypad { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); grid-template-rows: repeat(5, minmax(0, 1fr)); gap: clamp(4px, 1.5cqh, 6px); min-height: 0; overflow: hidden; }
    button { min-width: 0; min-height: 0; height: auto; border: 1px solid #dadce0; border-radius: 6px; background: #ffffff; color: #202124; cursor: var(--kritzel-global-pointer-cursor, pointer); font-size: clamp(11px, 5cqh, 15px); font-weight: 600; line-height: 1; }
    button:hover { background: #f8f9fa; }
    .operator { border-color: #dd0031; color: #dd0031; }
    .muted { color: #5f6368; }
    .equals { grid-row: span 2; height: auto; background: #dd0031; border-color: #dd0031; color: #ffffff; }
    .equals:hover { background: #c3002f; }
    .zero { grid-column: span 2; }
  `],
})
export class CalculatorWidgetComponent {
  protected readonly displayValue = signal(DEFAULT_CALCULATOR_STATE.displayValue);
  protected readonly pendingOperator = signal<CalculatorOperator | null>(DEFAULT_CALCULATOR_STATE.pendingOperator);
  private readonly storedValue = signal<number | null>(DEFAULT_CALCULATOR_STATE.storedValue);
  private readonly shouldReplaceDisplay = signal(DEFAULT_CALCULATOR_STATE.shouldReplaceDisplay);

  initializeFromState(state?: Partial<CalculatorWidgetState>): void {
    const nextState = this.normalizeState(state);

    this.displayValue.set(nextState.displayValue);
    this.storedValue.set(nextState.storedValue);
    this.pendingOperator.set(nextState.pendingOperator);
    this.shouldReplaceDisplay.set(nextState.shouldReplaceDisplay);
  }

  exportState(): CalculatorWidgetState {
    return {
      displayValue: this.displayValue(),
      storedValue: this.storedValue(),
      pendingOperator: this.pendingOperator(),
      shouldReplaceDisplay: this.shouldReplaceDisplay(),
    };
  }

  protected appendDigit(digit: string): void {
    if (this.shouldReplaceDisplay()) {
      this.displayValue.set(digit);
      this.shouldReplaceDisplay.set(false);
      return;
    }

    this.displayValue.update((value) => (value === '0' ? digit : `${value}${digit}`));
  }

  protected appendDecimal(): void {
    if (this.shouldReplaceDisplay()) {
      this.displayValue.set('0.');
      this.shouldReplaceDisplay.set(false);
      return;
    }

    this.displayValue.update((value) => value.includes('.') ? value : `${value}.`);
  }

  protected chooseOperator(operator: CalculatorOperator): void {
    const currentValue = this.parseDisplayValue();
    const previousValue = this.storedValue();
    const previousOperator = this.pendingOperator();

    this.storedValue.set(previousOperator && previousValue !== null ? this.runOperation(previousValue, currentValue, previousOperator) : currentValue);
    this.pendingOperator.set(operator);
    this.shouldReplaceDisplay.set(true);
  }

  protected calculate(): void {
    const previousValue = this.storedValue();
    const operator = this.pendingOperator();

    if (previousValue === null || !operator) {
      return;
    }

    const result = this.runOperation(previousValue, this.parseDisplayValue(), operator);

    this.displayValue.set(this.formatNumber(result));
    this.storedValue.set(null);
    this.pendingOperator.set(null);
    this.shouldReplaceDisplay.set(true);
  }

  protected clear(): void {
    this.initializeFromState(createCalculatorWidgetInitialState());
  }

  protected operatorLabel(operator: CalculatorOperator): string {
    return OPERATOR_LABELS[operator];
  }

  private normalizeState(state?: Partial<CalculatorWidgetState>): CalculatorWidgetState {
    const displayValue = typeof state?.displayValue === 'string' && Number.isFinite(Number(state.displayValue))
      ? state.displayValue
      : DEFAULT_CALCULATOR_STATE.displayValue;
    const storedValue = typeof state?.storedValue === 'number' && Number.isFinite(state.storedValue)
      ? state.storedValue
      : DEFAULT_CALCULATOR_STATE.storedValue;
    const pendingOperator = state?.pendingOperator && state.pendingOperator in OPERATOR_LABELS
      ? state.pendingOperator
      : DEFAULT_CALCULATOR_STATE.pendingOperator;

    return {
      displayValue,
      storedValue,
      pendingOperator,
      shouldReplaceDisplay: typeof state?.shouldReplaceDisplay === 'boolean'
        ? state.shouldReplaceDisplay
        : DEFAULT_CALCULATOR_STATE.shouldReplaceDisplay,
    };
  }

  private parseDisplayValue(): number {
    const value = Number(this.displayValue());
    return Number.isFinite(value) ? value : 0;
  }

  private runOperation(leftValue: number, rightValue: number, operator: CalculatorOperator): number {
    switch (operator) {
      case 'add':
        return leftValue + rightValue;
      case 'subtract':
        return leftValue - rightValue;
      case 'multiply':
        return leftValue * rightValue;
      case 'divide':
        return rightValue === 0 ? 0 : leftValue / rightValue;
    }
  }

  private formatNumber(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  }
}