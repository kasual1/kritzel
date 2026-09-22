import { ChangeDetectionStrategy, Component, OnDestroy, signal } from '@angular/core';

import {
  KritzelDynamicObject,
  KritzelDynamicObjectRendererRegistry,
  KritzelEditor,
  KritzelWorkspace,
} from '@kritzel/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';

const HTML_CALCULATOR_RENDERER_KEY = 'angular-dynamic-object-html-calculator';

type HtmlCalculatorOperator = 'add' | 'subtract' | 'multiply' | 'divide';

interface HtmlCalculatorState {
  displayValue: string;
  storedValue: number | null;
  pendingOperator: HtmlCalculatorOperator | null;
  shouldReplaceDisplay: boolean;
}

interface HtmlCalculatorRendererContext {
  object: KritzelDynamicObject;
  container: HTMLElement | null;
  data?: unknown;
}

interface HtmlCalculatorInstance {
  element: HTMLElement;
  destroy(): void;
  getState(): HtmlCalculatorState;
}

const DEFAULT_HTML_CALCULATOR_STATE: HtmlCalculatorState = {
  displayValue: '0',
  storedValue: null,
  pendingOperator: null,
  shouldReplaceDisplay: true,
};

const HTML_CALCULATOR_OPERATOR_LABELS: Record<HtmlCalculatorOperator, string> = {
  add: '+',
  subtract: '-',
  multiply: 'x',
  divide: '/',
};

function createHtmlCalculatorInitialState(): HtmlCalculatorState {
  return { ...DEFAULT_HTML_CALCULATOR_STATE };
}

function normalizeHtmlCalculatorState(data: unknown): HtmlCalculatorState {
  if (!data || typeof data !== 'object') {
    return createHtmlCalculatorInitialState();
  }

  const state = data as Partial<HtmlCalculatorState>;
  const displayValue = typeof state.displayValue === 'string' && Number.isFinite(Number(state.displayValue))
    ? state.displayValue
    : DEFAULT_HTML_CALCULATOR_STATE.displayValue;
  const storedValue = typeof state.storedValue === 'number' && Number.isFinite(state.storedValue)
    ? state.storedValue
    : DEFAULT_HTML_CALCULATOR_STATE.storedValue;
  const pendingOperator = state.pendingOperator && state.pendingOperator in HTML_CALCULATOR_OPERATOR_LABELS
    ? state.pendingOperator
    : DEFAULT_HTML_CALCULATOR_STATE.pendingOperator;

  return {
    displayValue,
    storedValue,
    pendingOperator,
    shouldReplaceDisplay: typeof state.shouldReplaceDisplay === 'boolean'
      ? state.shouldReplaceDisplay
      : DEFAULT_HTML_CALCULATOR_STATE.shouldReplaceDisplay,
  };
}

function createHtmlCalculatorElement(initialState: HtmlCalculatorState): HtmlCalculatorInstance {
  const root = document.createElement('div');
  root.className = 'html-calculator-root';

  const styles = document.createElement('style');
  styles.textContent = `
    .html-calculator-root { display: block; height: 100%; min-height: 0; box-sizing: border-box; overflow: visible; container-type: size; }
    .html-calculator-card { display: grid; grid-template-rows: auto minmax(0, 42px) minmax(0, 1fr); gap: clamp(4px, 2cqh, 10px); height: 100%; min-height: 0; padding: clamp(8px, 4cqh, 16px) clamp(6px, 3cqw, 12px); border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 12px 32px rgba(32, 33, 36, 0.12); box-sizing: border-box; overflow: hidden; font-family: Roboto, sans-serif; background: #ffffff; }
    .html-calculator-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 0; }
    .html-calculator-heading { margin: 0; font-size: clamp(12px, 5cqh, 16px); line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .html-calculator-operator-label { color: #dd0031; font-size: 13px; font-weight: 700; }
    .html-calculator-display { display: flex; align-items: center; justify-content: flex-end; min-height: 0; padding: 0 12px; border: 1px solid #e0e0e0; border-radius: 6px; background: #fafafa; color: #202124; font-size: clamp(16px, 8cqh, 24px); font-weight: 700; line-height: 1; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .html-calculator-keypad { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); grid-template-rows: repeat(5, minmax(0, 1fr)); gap: clamp(4px, 1.5cqh, 6px); min-height: 0; overflow: hidden; }
    .html-calculator-button { min-width: 0; min-height: 0; height: auto; border: 1px solid #dadce0; border-radius: 6px; background: #ffffff; color: #202124; cursor: var(--kritzel-global-pointer-cursor, pointer); font-size: clamp(11px, 5cqh, 15px); font-weight: 600; line-height: 1; }
    .html-calculator-button:hover { background: #f8f9fa; }
    .html-calculator-button--operator { border-color: #dd0031; color: #dd0031; }
    .html-calculator-button--muted { color: #5f6368; }
    .html-calculator-button--equals { grid-row: span 2; height: auto; background: #dd0031; border-color: #dd0031; color: #ffffff; }
    .html-calculator-button--equals:hover { background: #c3002f; }
    .html-calculator-button--zero { grid-column: span 2; }
  `;

  const card = document.createElement('section');
  card.className = 'html-calculator-card';
  card.setAttribute('aria-label', 'HTML calculator');

  const header = document.createElement('div');
  header.className = 'html-calculator-header';

  const heading = document.createElement('h3');
  heading.className = 'html-calculator-heading';
  heading.textContent = 'HTML Calculator';

  const operatorLabel = document.createElement('span');
  operatorLabel.className = 'html-calculator-operator-label';

  header.appendChild(heading);
  header.appendChild(operatorLabel);

  const display = document.createElement('output');
  display.className = 'html-calculator-display';
  display.setAttribute('aria-live', 'polite');

  const keypad = document.createElement('div');
  keypad.className = 'html-calculator-keypad';

  let displayValue = initialState.displayValue;
  let storedValue = initialState.storedValue;
  let pendingOperator = initialState.pendingOperator;
  let shouldReplaceDisplay = initialState.shouldReplaceDisplay;
  const cleanupCallbacks: Array<() => void> = [];

  const render = () => {
    display.textContent = displayValue;
    operatorLabel.textContent = pendingOperator ? HTML_CALCULATOR_OPERATOR_LABELS[pendingOperator] : '';
  };

  const parseDisplayValue = () => {
    const value = Number(displayValue);
    return Number.isFinite(value) ? value : 0;
  };

  const formatNumber = (value: number) => Number.isInteger(value)
    ? String(value)
    : value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');

  const runOperation = (leftValue: number, rightValue: number, operator: HtmlCalculatorOperator) => {
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
  };

  const appendDigit = (digit: string) => {
    if (shouldReplaceDisplay) {
      displayValue = digit;
      shouldReplaceDisplay = false;
      render();
      return;
    }

    displayValue = displayValue === '0' ? digit : `${displayValue}${digit}`;
    render();
  };

  const appendDecimal = () => {
    if (shouldReplaceDisplay) {
      displayValue = '0.';
      shouldReplaceDisplay = false;
      render();
      return;
    }

    if (!displayValue.includes('.')) {
      displayValue = `${displayValue}.`;
      render();
    }
  };

  const chooseOperator = (operator: HtmlCalculatorOperator) => {
    const currentValue = parseDisplayValue();

    storedValue = pendingOperator && storedValue !== null
      ? runOperation(storedValue, currentValue, pendingOperator)
      : currentValue;
    pendingOperator = operator;
    shouldReplaceDisplay = true;
    render();
  };

  const calculate = () => {
    if (storedValue === null || !pendingOperator) {
      return;
    }

    displayValue = formatNumber(runOperation(storedValue, parseDisplayValue(), pendingOperator));
    storedValue = null;
    pendingOperator = null;
    shouldReplaceDisplay = true;
    render();
  };

  const clear = () => {
    const nextState = createHtmlCalculatorInitialState();
    displayValue = nextState.displayValue;
    storedValue = nextState.storedValue;
    pendingOperator = nextState.pendingOperator;
    shouldReplaceDisplay = nextState.shouldReplaceDisplay;
    render();
  };

  const appendButton = (label: string, onClick: () => void, modifierClass?: string) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.className = ['html-calculator-button', modifierClass].filter(Boolean).join(' ');
    button.addEventListener('click', onClick);
    cleanupCallbacks.push(() => button.removeEventListener('click', onClick));
    keypad.appendChild(button);
  };

  appendButton('C', clear, 'html-calculator-button--muted');
  appendButton('/', () => chooseOperator('divide'), 'html-calculator-button--operator');
  appendButton('x', () => chooseOperator('multiply'), 'html-calculator-button--operator');
  appendButton('-', () => chooseOperator('subtract'), 'html-calculator-button--operator');

  appendButton('7', () => appendDigit('7'));
  appendButton('8', () => appendDigit('8'));
  appendButton('9', () => appendDigit('9'));
  appendButton('+', () => chooseOperator('add'), 'html-calculator-button--operator');

  appendButton('4', () => appendDigit('4'));
  appendButton('5', () => appendDigit('5'));
  appendButton('6', () => appendDigit('6'));
  appendButton('=', calculate, 'html-calculator-button--equals');

  appendButton('1', () => appendDigit('1'));
  appendButton('2', () => appendDigit('2'));
  appendButton('3', () => appendDigit('3'));

  appendButton('0', () => appendDigit('0'), 'html-calculator-button--zero');
  appendButton('.', appendDecimal);

  render();

  card.appendChild(header);
  card.appendChild(display);
  card.appendChild(keypad);
  root.appendChild(styles);
  root.appendChild(card);

  return {
    element: root,
    destroy: () => {
      cleanupCallbacks.forEach((cleanup) => cleanup());
    },
    getState: () => ({
      displayValue,
      storedValue,
      pendingOperator,
      shouldReplaceDisplay,
    }),
  };
}

@Component({
  selector: 'app-dynamic-objects-html',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      editorId="dynamic-objects-html"
      [theme]="'light'"
      [themes]="themes"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      [workspaces]="workspaces()"
    ></kritzel-editor>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }
    .toolbar-note { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #ebebeb; font: 13px Roboto, sans-serif; }
    .toolbar-note strong { color: #dd0031; }
    .toolbar-note span { color: #555; }
    kritzel-editor { flex: 1; min-height: 0; }
  `],
})
export class DynamicObjectsHtmlComponent implements OnDestroy {
  private readonly mountedCalculators = new Map<string, HtmlCalculatorInstance>();

  themes = [angularThemeLight, angularThemeDark];
  workspaces = signal([
    new KritzelWorkspace({ objects: [this.createInitialDynamicObject()] }),
  ]);

  constructor() {
    const renderer = {
      onMount: ({ object, container, data }: HtmlCalculatorRendererContext) => {
        if (!container) {
          return;
        }

        container.style.overflow = 'visible';
        this.destroyMountedCalculator(object.id, container);

        const instance = createHtmlCalculatorElement(normalizeHtmlCalculatorState(data));
        this.mountedCalculators.set(object.id, instance);

        container.innerHTML = '';
        container.appendChild(instance.element);
      },
      onSerialize: ({ object, data }: HtmlCalculatorRendererContext) => {
        return this.mountedCalculators.get(object.id)?.getState() ?? normalizeHtmlCalculatorState(data);
      },
      onUnmount: ({ object, container, data }: HtmlCalculatorRendererContext) => {
        const nextState = this.mountedCalculators.get(object.id)?.getState() ?? normalizeHtmlCalculatorState(data);
        this.destroyMountedCalculator(object.id, container);

        return nextState;
      },
    };

    KritzelDynamicObjectRendererRegistry.register(HTML_CALCULATOR_RENDERER_KEY, renderer);
  }

  private createInitialDynamicObject(): KritzelDynamicObject {
    const placeholder = document.createElement('div');
    placeholder.textContent = 'Loading Calculator...';

    const dynamicObject = new KritzelDynamicObject({
      element: placeholder,
      rendererKey: HTML_CALCULATOR_RENDERER_KEY,
      rendererData: createHtmlCalculatorInitialState(),
      translateX: -130,
      translateY: -190,
      width: 260,
      height: 320,
    });

    dynamicObject.isRotatable = false;

    return dynamicObject;
  }

  private destroyMountedCalculator(objectId: string, container: HTMLElement | null): void {
    const instance = this.mountedCalculators.get(objectId);

    if (instance) {
      instance.destroy();
      this.mountedCalculators.delete(objectId);
    }

    if (container) {
      container.innerHTML = '';
    }
  }

  ngOnDestroy(): void {
    this.mountedCalculators.forEach((instance) => {
      instance.destroy();
    });
    this.mountedCalculators.clear();

    KritzelDynamicObjectRendererRegistry.unregister(HTML_CALCULATOR_RENDERER_KEY);
  }
}
