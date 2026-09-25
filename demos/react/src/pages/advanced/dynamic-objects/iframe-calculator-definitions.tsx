import type { KritzelIframeContent } from "@kritzel/react-editor";

export type RuntimeIframeDefinition = {
  name: string;
  content: KritzelIframeContent;
  loadingContent: KritzelIframeContent;
  initialState: Record<string, unknown>;
};

export const mockChatPrompts = [
  "Create a simple calculator widget with basic arithmetic operations.",
  "Turn that calculator into a small scientific calculator with a few extra functions.",
  "Add a toggle at the top so users can switch between simple and scientific calculator modes.",
];

const calculatorCss = `
  :root { color: #202124; background: transparent; }
  body { display: flex; margin: 0; font-family: Roboto, sans-serif; }
  .calculator { display: grid; grid-template-rows: auto auto 46px minmax(0, 1fr); gap: 9px; width: 100%; height: 100%; padding: 14px; border: 1px solid #e5e7eb; border-radius: 12px; box-sizing: border-box; overflow: hidden; background: #fff; }
  .calculator.simple { grid-template-rows: auto 46px minmax(0, 1fr); }
  header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  h2 { margin: 0; font-size: 17px; }
  #mode-label { color: #087ea4; font-size: 12px; font-weight: 800; text-transform: uppercase; }
  #display { display: flex; align-items: center; justify-content: flex-end; padding: 0 12px; border: 1px solid #e0e0e0; border-radius: 7px; background: #f8fafc; font-size: 24px; font-weight: 800; overflow: hidden; }
  .keypad { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); grid-template-rows: repeat(5, minmax(0, 1fr)); gap: 6px; min-height: 0; }
  button { min-width: 0; min-height: 0; border: 1px solid #dadce0; border-radius: 7px; background: #fff; color: #202124; cursor: var(--kritzel-iframe-pointer-cursor, pointer); font-weight: 700; }
  .operator { border-color: #087ea4; color: #087ea4; }
  .equals { grid-row: span 2; background: #087ea4; border-color: #087ea4; color: #fff; }
  .zero { grid-column: span 2; }
  .toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 3px; border-radius: 9px; background: #f3f4f6; }
  .toggle button { height: 28px; border: 0; background: transparent; }
  .toggle button.active { background: #fff; color: #087ea4; box-shadow: 0 1px 4px rgba(32, 33, 36, .12); }
  .is-simple .scientific { display: none; }
`;

const calculatorScript = `
  const root = document.querySelector('.calculator');
  const display = document.querySelector('#display');
  const modeLabel = document.querySelector('#mode-label');
  const read = () => ({ displayValue: String(kritzel.state.displayValue ?? '0'), storedValue: typeof kritzel.state.storedValue === 'number' ? kritzel.state.storedValue : null, pendingOperator: kritzel.state.pendingOperator ?? null, shouldReplaceDisplay: typeof kritzel.state.shouldReplaceDisplay === 'boolean' ? kritzel.state.shouldReplaceDisplay : true, mode: kritzel.state.mode === 'scientific' ? 'scientific' : 'simple' });
  const write = (patch) => { kritzel.setState({ ...read(), ...patch }); render(); };
  const number = () => Number(read().displayValue) || 0;
  const operation = (left, right, op) => op === 'add' ? left + right : op === 'subtract' ? left - right : op === 'multiply' ? left * right : right === 0 ? 0 : left / right;
  const format = (value) => Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/0+$/, '').replace(/\\.$/, '');
  const render = () => { const state = read(); display.textContent = state.displayValue; modeLabel.textContent = state.pendingOperator ?? state.mode; root.classList.toggle('is-simple', state.mode === 'simple'); document.querySelectorAll('[data-mode]').forEach((button) => button.classList.toggle('active', button.dataset.mode === state.mode)); };
  document.querySelectorAll('[data-digit]').forEach((button) => button.addEventListener('click', () => { const state = read(); write({ displayValue: state.shouldReplaceDisplay ? button.dataset.digit : state.displayValue === '0' ? button.dataset.digit : state.displayValue + button.dataset.digit, shouldReplaceDisplay: false }); }));
  document.querySelectorAll('[data-operator]').forEach((button) => button.addEventListener('click', () => { const state = read(); write({ storedValue: state.pendingOperator && state.storedValue !== null ? operation(state.storedValue, number(), state.pendingOperator) : number(), pendingOperator: button.dataset.operator, shouldReplaceDisplay: true }); }));
  document.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => { const state = read(); const action = button.dataset.action; if (action === 'clear') write({ displayValue: '0', storedValue: null, pendingOperator: null, shouldReplaceDisplay: true }); if (action === 'decimal' && !state.displayValue.includes('.')) write({ displayValue: state.shouldReplaceDisplay ? '0.' : state.displayValue + '.', shouldReplaceDisplay: false }); if (action === 'equals' && state.storedValue !== null && state.pendingOperator) write({ displayValue: format(operation(state.storedValue, number(), state.pendingOperator)), storedValue: null, pendingOperator: null, shouldReplaceDisplay: true }); if (action === 'sqrt') write({ displayValue: format(Math.sqrt(Math.max(number(), 0))), shouldReplaceDisplay: true }); if (action === 'square') write({ displayValue: format(number() * number()), shouldReplaceDisplay: true }); if (action === 'pi') write({ displayValue: format(Math.PI), shouldReplaceDisplay: true }); }));
  document.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => write({ mode: button.dataset.mode })));
  addEventListener('kritzelstatechange', render);
  render();
`;

const loadingContent: KritzelIframeContent = {
  html: '<main class="loading" aria-busy="true"><strong>Generating calculator...</strong><span></span><span></span><span></span></main>',
  css: ':root{background:#eef1f4}body{margin:0;font-family:Roboto,sans-serif}.loading{display:grid;gap:14px;height:100%;padding:24px;box-sizing:border-box;background:linear-gradient(90deg,#edf1f4,#fff,#edf1f4);background-size:200% 100%;animation:shimmer 1.2s linear infinite}.loading span{display:block;height:32px;border-radius:7px;background:rgba(255,255,255,.7)}@keyframes shimmer{to{background-position:-200% 0}}',
  script: "",
};

function calculatorHtml(title: string, includeScientific: boolean, includeToggle: boolean): string {
  return `<main class="calculator ${includeToggle ? "has-toggle is-simple" : includeScientific ? "" : "simple is-simple"}">
    <header><h2>${title}</h2><span id="mode-label">${includeScientific ? "scientific" : "simple"}</span></header>
    ${includeToggle ? '<div class="toggle"><button type="button" data-mode="simple">Simple</button><button type="button" data-mode="scientific">Scientific</button></div>' : ""}
    <output id="display">0</output>
    <div class="keypad">
      <button data-action="clear">C</button><button class="scientific" data-action="sqrt">sqrt</button><button class="scientific" data-action="square">x2</button><button class="scientific" data-action="pi">pi</button>
      <button class="operator" data-operator="divide">/</button><button class="operator" data-operator="multiply">x</button><button class="operator" data-operator="subtract">-</button><button class="operator" data-operator="add">+</button>
      <button data-digit="7">7</button><button data-digit="8">8</button><button data-digit="9">9</button><button class="equals" data-action="equals">=</button>
      <button data-digit="4">4</button><button data-digit="5">5</button><button data-digit="6">6</button>
      <button data-digit="1">1</button><button data-digit="2">2</button><button data-digit="3">3</button>
      <button class="zero" data-digit="0">0</button><button data-action="decimal">.</button>
    </div>
  </main>`;
}

export const mockComponentDefinitions: RuntimeIframeDefinition[] = [
  { name: "Simple calculator", content: { html: calculatorHtml("Simple Calculator", false, false), css: calculatorCss, script: calculatorScript }, loadingContent, initialState: { displayValue: "0", storedValue: null, pendingOperator: null, shouldReplaceDisplay: true, mode: "simple" } },
  { name: "Scientific calculator", content: { html: calculatorHtml("Scientific Calculator", true, false), css: calculatorCss, script: calculatorScript }, loadingContent, initialState: { displayValue: "0", storedValue: null, pendingOperator: null, shouldReplaceDisplay: true, mode: "scientific" } },
  { name: "Toggle calculator", content: { html: calculatorHtml("Adaptive Calculator", true, true), css: calculatorCss, script: calculatorScript }, loadingContent, initialState: { displayValue: "0", storedValue: null, pendingOperator: null, shouldReplaceDisplay: true, mode: "simple" } },
];