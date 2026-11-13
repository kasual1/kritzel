import type { UpdrawIframeContent } from '@updraw/vue-editor'

export interface RuntimeIframeDefinition {
  name: string
  content: UpdrawIframeContent
  initialState: Record<string, unknown>
}

export const mockChatPrompts = [
  'Create a simple calculator widget with basic arithmetic operations.',
  'Turn that calculator into a small scientific calculator with a few extra functions.',
  'Add a toggle at the top so users can switch between simple and scientific calculator modes.',
]

const calculatorCss = `
  :root { color: #202124; background: transparent; }
  body { display: flex; margin: 0; padding: 0; box-sizing: border-box; font-family: Roboto, sans-serif; }
  .calculator-card { display: grid; grid-template-rows: auto 46px minmax(0, 1fr); gap: 10px; width: 100%; height: 100%; min-height: 0; padding: 14px; border: 1px solid #e5e7eb; border-radius: 12px; box-sizing: border-box; overflow: hidden; background: #ffffff; }
  .calculator-card.has-toggle { grid-template-rows: auto auto 46px minmax(0, 1fr); }
  .header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  h2 { margin: 0; font-size: 17px; line-height: 1.2; }
  .mode-label { color: #167a55; font-size: 12px; font-weight: 800; text-transform: uppercase; }
  .display { display: flex; align-items: center; justify-content: flex-end; min-width: 0; padding: 0 12px; border: 1px solid #e0e0e0; border-radius: 7px; background: #f8fafc; font-size: 24px; font-weight: 800; line-height: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .keypad { display: grid; gap: 6px; min-height: 0; }
  .simple-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); grid-template-rows: repeat(5, minmax(0, 1fr)); }
  .scientific-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); grid-template-rows: repeat(5, minmax(0, 1fr)); }
  button { min-width: 0; min-height: 0; border: 1px solid #dadce0; border-radius: 7px; background: #ffffff; color: #202124; cursor: var(--updraw-iframe-pointer-cursor, pointer); font: inherit; font-size: 14px; font-weight: 700; line-height: 1; }
  button:hover { background: #f3f4f6; }
  .operator { border-color: #42b883; color: #167a55; }
  .muted { color: #5f6368; }
  .equals { grid-row: span 2; background: #42b883; border-color: #42b883; color: #ffffff; }
  .equals:hover { background: #339a6e; }
  .zero { grid-column: span 2; }
  .toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 3px; border-radius: 9px; background: #f3f4f6; }
  .toggle button { height: 28px; border: 0; border-radius: 7px; background: transparent; color: #5f6368; font-size: 12px; }
  .toggle button.active { background: #ffffff; color: #167a55; box-shadow: 0 1px 4px rgba(32, 33, 36, 0.12); }
  .is-simple .scientific-only { display: none; }
  .is-simple .scientific-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .has-toggle.is-simple .equals { grid-column: 4; grid-row: 3 / span 2; }
`

const calculatorScript = `
  const root = document.querySelector('.calculator-card');
  const display = document.querySelector('#display');
  const modeLabel = document.querySelector('#mode-label');
  const toggleButtons = Array.from(document.querySelectorAll('[data-mode]'));
  const operatorLabels = { add: '+', subtract: '-', multiply: 'x', divide: '/' };

  const getState = () => ({
    displayValue: String(updraw.state.displayValue ?? '0'),
    storedValue: typeof updraw.state.storedValue === 'number' ? updraw.state.storedValue : null,
    pendingOperator: updraw.state.pendingOperator ?? null,
    shouldReplaceDisplay: typeof updraw.state.shouldReplaceDisplay === 'boolean' ? updraw.state.shouldReplaceDisplay : true,
    mode: updraw.state.mode === 'scientific' ? 'scientific' : 'simple',
  });

  const setState = (nextState) => {
    updraw.setState({ ...getState(), ...nextState });
    render();
  };

  const formatNumber = (value) => Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/0+$/, '').replace(/\\.$/, '');
  const parseDisplayValue = () => {
    const value = Number(getState().displayValue);
    return Number.isFinite(value) ? value : 0;
  };
  const runOperation = (leftValue, rightValue, operator) => {
    if (operator === 'add') return leftValue + rightValue;
    if (operator === 'subtract') return leftValue - rightValue;
    if (operator === 'multiply') return leftValue * rightValue;
    if (operator === 'divide') return rightValue === 0 ? 0 : leftValue / rightValue;
    return rightValue;
  };

  const render = () => {
    const state = getState();
    display.textContent = state.displayValue;
    if (modeLabel) modeLabel.textContent = state.pendingOperator ? operatorLabels[state.pendingOperator] : state.mode;
    if (root) root.classList.toggle('is-simple', state.mode !== 'scientific');
    toggleButtons.forEach((button) => button.classList.toggle('active', button.dataset.mode === state.mode));
  };

  const appendDigit = (digit) => {
    const state = getState();
    setState({
      displayValue: state.shouldReplaceDisplay ? digit : state.displayValue === '0' ? digit : state.displayValue + digit,
      shouldReplaceDisplay: false,
    });
  };

  const appendDecimal = () => {
    const state = getState();
    if (state.shouldReplaceDisplay) {
      setState({ displayValue: '0.', shouldReplaceDisplay: false });
      return;
    }
    if (!state.displayValue.includes('.')) setState({ displayValue: state.displayValue + '.' });
  };

  const chooseOperator = (operator) => {
    const state = getState();
    const currentValue = parseDisplayValue();
    setState({
      storedValue: state.pendingOperator && state.storedValue !== null ? runOperation(state.storedValue, currentValue, state.pendingOperator) : currentValue,
      pendingOperator: operator,
      shouldReplaceDisplay: true,
    });
  };

  const calculate = () => {
    const state = getState();
    if (state.storedValue === null || !state.pendingOperator) return;
    setState({
      displayValue: formatNumber(runOperation(state.storedValue, parseDisplayValue(), state.pendingOperator)),
      storedValue: null,
      pendingOperator: null,
      shouldReplaceDisplay: true,
    });
  };

  const applyFunction = (action) => {
    const value = parseDisplayValue();
    if (action === 'clear') setState({ displayValue: '0', storedValue: null, pendingOperator: null, shouldReplaceDisplay: true });
    if (action === 'decimal') appendDecimal();
    if (action === 'pi') setState({ displayValue: formatNumber(Math.PI), shouldReplaceDisplay: true });
    if (action === 'sqrt') setState({ displayValue: formatNumber(Math.sqrt(Math.max(value, 0))), shouldReplaceDisplay: true });
    if (action === 'square') setState({ displayValue: formatNumber(value * value), shouldReplaceDisplay: true });
    if (action === 'sin') setState({ displayValue: formatNumber(Math.sin(value)), shouldReplaceDisplay: true });
    if (action === 'cos') setState({ displayValue: formatNumber(Math.cos(value)), shouldReplaceDisplay: true });
  };

  document.querySelectorAll('[data-digit]').forEach((button) => button.addEventListener('click', () => appendDigit(button.dataset.digit)));
  document.querySelectorAll('[data-operator]').forEach((button) => button.addEventListener('click', () => chooseOperator(button.dataset.operator)));
  document.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => button.dataset.action === 'equals' ? calculate() : applyFunction(button.dataset.action)));
  toggleButtons.forEach((button) => button.addEventListener('click', () => setState({ mode: button.dataset.mode })));
  addEventListener('updrawstatechange', render);
  render();
`

const simpleHtml = `
        <main class="calculator-card is-simple">
          <div class="header"><h2>Simple Calculator</h2><span id="mode-label" class="mode-label">simple</span></div>
          <output id="display" class="display" aria-live="polite">0</output>
          <div class="keypad simple-grid">
            <button class="muted" type="button" data-action="clear">C</button>
            <button class="operator" type="button" data-operator="divide">/</button>
            <button class="operator" type="button" data-operator="multiply">x</button>
            <button class="operator" type="button" data-operator="subtract">-</button>
            <button type="button" data-digit="7">7</button><button type="button" data-digit="8">8</button><button type="button" data-digit="9">9</button><button class="operator" type="button" data-operator="add">+</button>
            <button type="button" data-digit="4">4</button><button type="button" data-digit="5">5</button><button type="button" data-digit="6">6</button><button class="equals" type="button" data-action="equals">=</button>
            <button type="button" data-digit="1">1</button><button type="button" data-digit="2">2</button><button type="button" data-digit="3">3</button>
            <button class="zero" type="button" data-digit="0">0</button><button type="button" data-action="decimal">.</button>
          </div>
        </main>
      `

const scientificHtml = `
        <main class="calculator-card">
          <div class="header"><h2>Scientific Calculator</h2><span id="mode-label" class="mode-label">scientific</span></div>
          <output id="display" class="display" aria-live="polite">0</output>
          <div class="keypad scientific-grid">
            <button class="muted" type="button" data-action="clear">C</button><button type="button" data-action="sqrt">√</button><button type="button" data-action="square">x²</button><button type="button" data-action="sin">sin</button><button type="button" data-action="cos">cos</button>
            <button type="button" data-action="pi">π</button><button class="operator" type="button" data-operator="divide">/</button><button class="operator" type="button" data-operator="multiply">x</button><button class="operator" type="button" data-operator="subtract">-</button><button class="operator" type="button" data-operator="add">+</button>
            <button type="button" data-digit="7">7</button><button type="button" data-digit="8">8</button><button type="button" data-digit="9">9</button><button type="button" data-digit="4">4</button><button type="button" data-digit="5">5</button>
            <button type="button" data-digit="6">6</button><button type="button" data-digit="1">1</button><button type="button" data-digit="2">2</button><button type="button" data-digit="3">3</button><button class="equals" type="button" data-action="equals">=</button>
            <button class="zero" type="button" data-digit="0">0</button><button type="button" data-action="decimal">.</button>
          </div>
        </main>
      `

const toggleHtml = `
        <main class="calculator-card has-toggle is-simple">
          <div class="header"><h2>Adaptive Calculator</h2><span id="mode-label" class="mode-label">simple</span></div>
          <div class="toggle" aria-label="Calculator mode"><button type="button" data-mode="simple">Simple</button><button type="button" data-mode="scientific">Scientific</button></div>
          <output id="display" class="display" aria-live="polite">0</output>
          <div class="keypad scientific-grid">
            <button class="muted" type="button" data-action="clear">C</button><button class="scientific-only" type="button" data-action="sqrt">√</button><button class="scientific-only" type="button" data-action="square">x²</button><button class="scientific-only" type="button" data-action="sin">sin</button><button class="scientific-only" type="button" data-action="cos">cos</button>
            <button class="scientific-only" type="button" data-action="pi">π</button><button class="operator" type="button" data-operator="divide">/</button><button class="operator" type="button" data-operator="multiply">x</button><button class="operator" type="button" data-operator="subtract">-</button><button class="operator" type="button" data-operator="add">+</button>
            <button type="button" data-digit="7">7</button><button type="button" data-digit="8">8</button><button type="button" data-digit="9">9</button><button type="button" data-digit="4">4</button><button type="button" data-digit="5">5</button>
            <button type="button" data-digit="6">6</button><button type="button" data-digit="1">1</button><button type="button" data-digit="2">2</button><button type="button" data-digit="3">3</button><button class="equals" type="button" data-action="equals">=</button>
            <button class="zero" type="button" data-digit="0">0</button><button type="button" data-action="decimal">.</button>
          </div>
        </main>
      `

export const mockComponentDefinitions: RuntimeIframeDefinition[] = [
  {
    name: 'Simple calculator',
    content: { html: simpleHtml, css: calculatorCss, script: calculatorScript },
    initialState: { displayValue: '0', storedValue: null, pendingOperator: null, shouldReplaceDisplay: true, mode: 'simple' },
  },
  {
    name: 'Scientific calculator',
    content: { html: scientificHtml, css: calculatorCss, script: calculatorScript },
    initialState: { displayValue: '0', storedValue: null, pendingOperator: null, shouldReplaceDisplay: true, mode: 'scientific' },
  },
  {
    name: 'Toggle calculator',
    content: { html: toggleHtml, css: calculatorCss, script: calculatorScript },
    initialState: { displayValue: '0', storedValue: null, pendingOperator: null, shouldReplaceDisplay: true, mode: 'simple' },
  },
]
