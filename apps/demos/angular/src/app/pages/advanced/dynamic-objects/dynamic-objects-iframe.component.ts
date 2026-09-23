import { ChangeDetectionStrategy, Component, computed, OnDestroy, signal } from '@angular/core';

import {
  KritzelEditor,
  KritzelIframeObject,
  KritzelWorkspace,
} from '@kritzel/angular-editor';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { angularThemeLight } from '../../../const/angular-theme-light';

interface RuntimeIframeDefinition {
  name: string;
  content: { html: string; css: string; script: string };
  loadingContent?: { html: string; css: string; script: string };
  initialState: Record<string, unknown>;
}

const MOCK_CHAT_PROMPTS = [
  'Create a simple calculator widget with basic arithmetic operations.',
  'Turn that calculator into a small scientific calculator with a few extra functions.',
  'Add a toggle at the top so users can switch between simple and scientific calculator modes.',
];

const IDLE_IFRAME_DEFINITION: RuntimeIframeDefinition = {
  name: 'Waiting for prompt',
  content: {
    html: `
      <main class="card idle-card">
        <p class="eyebrow">Mock LLM canvas</p>
        <h2>Waiting for a prompt</h2>
        <p class="summary">Send the prompt below to replace this sandboxed iframe with a generated calculator widget.</p>
      </main>
    `,
    css: `
      :root { color: #24313d; background: #f3f6f8; }
      .card { box-sizing: border-box; min-height: 100%; padding: 20px; background: #f3f6f8; font-family: Roboto, sans-serif; }
      .eyebrow { margin: 0 0 12px; color: #5d6b78; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
      h2 { margin: 0; font-size: 22px; }
      .summary { margin: 10px 0 0; color: #5d6b78; font-size: 13px; line-height: 1.5; }
    `,
    script: '',
  },
  initialState: {},
};

const CALCULATOR_BASE_CSS = `
  :root { color: #202124; background: transparent; }
  body { display: flex; margin: 0; padding: 0; box-sizing: border-box; font-family: Roboto, sans-serif; }
  .calculator-card { display: grid; grid-template-rows: auto 46px minmax(0, 1fr); gap: 10px; width: 100%; height: 100%; min-height: 0; padding: 14px; border: 1px solid #e5e7eb; border-radius: 12px; box-sizing: border-box; overflow: hidden; background: #ffffff; }
  .calculator-card.has-toggle { grid-template-rows: auto auto 46px minmax(0, 1fr); }
  .header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  h2 { margin: 0; font-size: 17px; line-height: 1.2; }
  .mode-label { color: #dd0031; font-size: 12px; font-weight: 800; text-transform: uppercase; }
  .display { display: flex; align-items: center; justify-content: flex-end; min-width: 0; padding: 0 12px; border: 1px solid #e0e0e0; border-radius: 7px; background: #f8fafc; font-size: 24px; font-weight: 800; line-height: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .keypad { display: grid; gap: 6px; min-height: 0; }
  .simple-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); grid-template-rows: repeat(5, minmax(0, 1fr)); }
  .scientific-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); grid-template-rows: repeat(5, minmax(0, 1fr)); }
  button { min-width: 0; min-height: 0; border: 1px solid #dadce0; border-radius: 7px; background: #ffffff; color: #202124; cursor: var(--kritzel-iframe-pointer-cursor, pointer); font: inherit; font-size: 14px; font-weight: 700; line-height: 1; }
  button:hover { background: #f3f4f6; }
  .operator { border-color: #dd0031; color: #dd0031; }
  .muted { color: #5f6368; }
  .equals { grid-row: span 2; background: #dd0031; border-color: #dd0031; color: #ffffff; }
  .equals:hover { background: #c3002f; }
  .zero { grid-column: span 2; }
  .toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 3px; border-radius: 9px; background: #f3f4f6; }
  .toggle button { height: 28px; border: 0; border-radius: 7px; background: transparent; color: #5f6368; font-size: 12px; }
  .toggle button.active { background: #ffffff; color: #dd0031; box-shadow: 0 1px 4px rgba(32, 33, 36, 0.12); }
  .is-simple .scientific-only { display: none; }
  .is-simple .scientific-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .has-toggle.is-simple .equals { grid-column: 4; grid-row: 3 / span 2; }
`;

const IFRAME_LOADING_CONTENT: RuntimeIframeDefinition['content'] = {
  html: `
    <main class="loading-surface" aria-busy="true" aria-label="Generating content">
      <span class="sr-only">Generating content</span>
      <div class="loading-header">
        <span class="placeholder placeholder-title"></span>
        <span class="placeholder placeholder-chip"></span>
      </div>
      <span class="placeholder placeholder-line placeholder-line-long"></span>
      <span class="placeholder placeholder-line placeholder-line-short"></span>
      <div class="placeholder placeholder-preview"></div>
      <div class="loading-actions">
        <span class="placeholder placeholder-action"></span>
        <span class="placeholder placeholder-action"></span>
        <span class="placeholder placeholder-action"></span>
      </div>
    </main>
  `,
  css: `
  :root { background: #eef1f4; }
  body { display: flex; margin: 0; padding: 0; box-sizing: border-box; background: #eef1f4; font-family: Roboto, sans-serif; }
  .loading-surface {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    height: 100%;
    padding: 20px;
    border: 1px solid #e1e6eb;
    border-radius: 12px;
    box-sizing: border-box;
    overflow: hidden;
    background: linear-gradient(90deg, #edf1f4 0%, #f4f6f8 25%, #ebeff3 50%, #f4f6f8 75%, #edf1f4 100%);
    background-size: 200% 100%;
    animation: shimmer 1.25s linear infinite;
  }
  .loading-surface::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent);
    transform: translateX(-100%);
    animation: sweep 1.25s ease-in-out infinite;
  }
  .loading-header, .loading-actions { display: flex; align-items: center; gap: 9px; }
  .loading-header { justify-content: space-between; margin-bottom: 4px; }
  .loading-actions { margin-top: auto; }
  .placeholder {
    display: block;
    flex: none;
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-radius: 6px;
    background: rgba(255,255,255,0.52);
  }
  .placeholder-title { width: 42%; height: 20px; }
  .placeholder-chip { width: 54px; height: 18px; border-radius: 9px; }
  .placeholder-line { height: 10px; }
  .placeholder-line-long { width: 76%; }
  .placeholder-line-short { width: 54%; }
  .placeholder-preview { flex: 1; width: 100%; min-height: 90px; margin-top: 4px; border-radius: 8px; }
  .placeholder-action { width: 58px; height: 28px; }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @keyframes sweep {
    0% { transform: translateX(-120%); }
    100% { transform: translateX(120%); }
  }
  `,
  script: '',
};

const CALCULATOR_SCRIPT = `
  const root = document.querySelector('.calculator-card');
  const display = document.querySelector('#display');
  const modeLabel = document.querySelector('#mode-label');
  const toggleButtons = Array.from(document.querySelectorAll('[data-mode]'));
  const operatorLabels = { add: '+', subtract: '-', multiply: 'x', divide: '/' };

  const getState = () => ({
    displayValue: String(kritzel.state.displayValue ?? '0'),
    storedValue: typeof kritzel.state.storedValue === 'number' ? kritzel.state.storedValue : null,
    pendingOperator: kritzel.state.pendingOperator ?? null,
    shouldReplaceDisplay: typeof kritzel.state.shouldReplaceDisplay === 'boolean' ? kritzel.state.shouldReplaceDisplay : true,
    mode: kritzel.state.mode === 'scientific' ? 'scientific' : 'simple',
  });

  const setState = (nextState) => {
    kritzel.setState({ ...getState(), ...nextState });
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
  addEventListener('kritzelstatechange', render);
  render();
`;

const MOCK_COMPONENT_DEFINITIONS: RuntimeIframeDefinition[] = [
  {
    name: 'Simple calculator',
    content: {
      html: `
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
      `,
      css: CALCULATOR_BASE_CSS,
      script: CALCULATOR_SCRIPT,
    },
    loadingContent: IFRAME_LOADING_CONTENT,
    initialState: { displayValue: '0', storedValue: null, pendingOperator: null, shouldReplaceDisplay: true, mode: 'simple' },
  },
  {
    name: 'Scientific calculator',
    content: {
      html: `
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
      `,
      css: CALCULATOR_BASE_CSS,
      script: CALCULATOR_SCRIPT,
    },
    loadingContent: IFRAME_LOADING_CONTENT,
    initialState: { displayValue: '0', storedValue: null, pendingOperator: null, shouldReplaceDisplay: true, mode: 'scientific' },
  },
  {
    name: 'Toggle calculator',
    content: {
      html: `
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
      `,
      css: CALCULATOR_BASE_CSS,
      script: CALCULATOR_SCRIPT,
    },
    loadingContent: IFRAME_LOADING_CONTENT,
    initialState: { displayValue: '0', storedValue: null, pendingOperator: null, shouldReplaceDisplay: true, mode: 'simple' },
  },
];

@Component({
  selector: 'app-dynamic-objects-iframe',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      editorId="dynamic-objects-iframe"
      [theme]="'light'"
      [themes]="themes"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isToolbarVisible]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      [workspaces]="workspaces()"
    ></kritzel-editor>
    <div class="chat-input">
      <div class="textarea-wrapper">
        <textarea
          rows="3"
          aria-label="Mock LLM prompt"
          [value]="promptText()"
          (input)="updatePromptText($event)"
        ></textarea>
        <div class="query-nav" aria-label="Mock prompt navigation">
          <button type="button" class="nav-button" aria-label="Previous query" [disabled]="isFirstQuery()" (click)="showPrompt(-1)">‹</button>
          <span>{{ queryLabel() }}</span>
          <button type="button" class="nav-button" aria-label="Next query" [disabled]="isLastQuery()" (click)="showPrompt(1)">›</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { position: relative; display: block; height: 100%; }
    kritzel-editor { display: block; width: 100%; height: 100%; }
    .chat-input { position: absolute; left: 50%; bottom: 18px; z-index: 20; display: block; width: min(460px, calc(100% - 32px)); padding: 10px; border: 1px solid #e5e7eb; border-radius: 16px; background: #ffffff; box-shadow: 0 16px 42px rgba(32, 33, 36, 0.18); box-sizing: border-box; transform: translateX(-50%); font-family: Roboto, sans-serif; }
    .textarea-wrapper { position: relative; width: 100%; }
    textarea { display: block; width: 100%; height: 98px; min-height: 98px; max-height: 98px; resize: none; border: 0; border-radius: 12px; padding: 12px 14px 38px 14px; box-sizing: border-box; background: #f3f4f6; color: #202124; font: inherit; line-height: 1.45; }
    textarea:focus, textarea:focus-visible { border: 0; outline: 0; box-shadow: none; }
    .query-nav { position: absolute; right: 8px; bottom: 8px; display: flex; align-items: center; gap: 6px; color: #5f6368; font-size: 12px; font-weight: 700; white-space: nowrap; user-select: none; }
    .nav-button { width: 26px; height: 26px; border: 0; border-radius: 999px; padding: 0; background: #ffffff; color: #202124; cursor: pointer; font: inherit; font-size: 18px; line-height: 1; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(32, 33, 36, 0.12); }
    .nav-button:hover { background: #e5e7eb; }
    .nav-button:disabled { color: #b8bdc4; cursor: default; opacity: 0.55; box-shadow: none; }
    .nav-button:disabled:hover { background: #ffffff; }
  `],
})
export class DynamicObjectsIframeComponent implements OnDestroy {
  private readonly runtimeObject = this.createRuntimeObject();
  private readonly promptIndex = signal(0);
  private responseTimeout: ReturnType<typeof setTimeout> | null = null;

  themes = [angularThemeLight, angularThemeDark];
  promptText = signal(MOCK_CHAT_PROMPTS[0]);
  queryLabel = computed(() => `${this.promptIndex() + 1} of ${MOCK_CHAT_PROMPTS.length}`);
  isFirstQuery = computed(() => this.promptIndex() === 0);
  isLastQuery = computed(() => this.promptIndex() === MOCK_CHAT_PROMPTS.length - 1);
  workspaces = signal([
    new KritzelWorkspace({ objects: [this.runtimeObject] }),
  ]);

  updatePromptText(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLTextAreaElement) {
      this.promptText.set(target.value);
    }
  }

  sendPrompt(event: SubmitEvent): void {
    event.preventDefault();

    const index = this.promptIndex();
    const nextIndex = Math.min(index + 1, MOCK_CHAT_PROMPTS.length - 1);

    this.promptIndex.set(nextIndex);
    this.promptText.set(MOCK_CHAT_PROMPTS[nextIndex]);
    this.renderMockResponse(nextIndex);
  }

  showPrompt(offset: -1 | 1): void {
    const nextIndex = Math.max(0, Math.min(this.promptIndex() + offset, MOCK_CHAT_PROMPTS.length - 1));

    if (nextIndex === this.promptIndex()) {
      return;
    }

    this.promptIndex.set(nextIndex);
    this.promptText.set(MOCK_CHAT_PROMPTS[nextIndex]);
    this.renderMockResponse(nextIndex);
  }

  ngOnDestroy(): void {
    if (this.responseTimeout) {
      clearTimeout(this.responseTimeout);
    }
  }

  private renderMockResponse(index: number): void {
    if (this.responseTimeout) {
      clearTimeout(this.responseTimeout);
    }

    const definition = MOCK_COMPONENT_DEFINITIONS[index];
    const loadingContent = definition.loadingContent ?? definition.content;

    this.runtimeObject.setLoadingContent(loadingContent);
    this.runtimeObject.setContent(loadingContent);
    this.runtimeObject.setLoading(true);

    this.responseTimeout = setTimeout(() => {
      this.runtimeObject.setState(definition.initialState);
      this.runtimeObject.setContent(definition.content);
      this.runtimeObject.setLoading(false);
      this.responseTimeout = null;
    }, 1100);
  }

  private createRuntimeObject(): KritzelIframeObject {
    const definition = MOCK_COMPONENT_DEFINITIONS[0];
    const iframeObject = new KritzelIframeObject({
      content: definition.content,
      loadingContent: definition.loadingContent ?? definition.content,
      isLoading: false,
      state: definition.initialState,
      title: 'Simple calculator',
      translateX: -140,
      translateY: -200,
      width: 280,
      height: 320,
      borderRadius: 12,
      boxShadow: '0 12px 32px rgba(32, 33, 36, 0.12)',
    });

    iframeObject.isRotatable = false;
    return iframeObject;
  }
}
