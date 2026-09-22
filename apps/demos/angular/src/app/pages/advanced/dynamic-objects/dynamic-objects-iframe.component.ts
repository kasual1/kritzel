import { ChangeDetectionStrategy, Component, OnDestroy, signal } from '@angular/core';

import {
  KritzelDynamicObject,
  KritzelDynamicObjectRendererRegistry,
  KritzelEditor,
  KritzelWorkspace,
} from '@kritzel/angular-editor';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { angularThemeLight } from '../../../const/angular-theme-light';

const RUNTIME_IFRAME_RENDERER_KEY = 'angular-dynamic-object-runtime-iframe';
const RUNTIME_IFRAME_STATE_MESSAGE = 'kritzel-runtime-iframe-state';
const RUNTIME_IFRAME_POINTER_MESSAGE = 'kritzel-runtime-iframe-pointer';

interface RuntimeIframeDefinition {
  name: string;
  html: string;
  css: string;
  script: string;
}

interface RuntimeIframeData {
  definition: RuntimeIframeDefinition;
  state: Record<string, unknown>;
  revision: number;
}

interface RuntimeIframeCursors {
  default: string;
  pointer: string;
}

interface RuntimeIframePointerMessage {
  type: typeof RUNTIME_IFRAME_POINTER_MESSAGE;
  eventType: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel';
  pointerId: number;
  pointerType: string;
  clientX: number;
  clientY: number;
  button: number;
  buttons: number;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}

interface RuntimeIframeRendererContext {
  object: KritzelDynamicObject;
  container: HTMLElement | null;
  data?: unknown;
}

interface RuntimeIframeInstance {
  iframe: HTMLIFrameElement;
  destroy(): void;
  update(data: RuntimeIframeData): void;
}

const MOCK_COMPONENT_DEFINITIONS: RuntimeIframeDefinition[] = [
  {
    name: 'Launch checklist',
    html: `
      <main class="card checklist-card">
        <p class="eyebrow">Generated workspace</p>
        <h2>Launch checklist</h2>
        <p class="summary">A mocked LLM response rendered in a sandboxed iframe.</p>
        <button id="progress-button" type="button">Mark next item complete</button>
        <p id="progress" class="progress"></p>
      </main>
    `,
    css: `
      :root { color: #18312b; background: #e9f4ed; }
      .card { box-sizing: border-box; min-height: 100%; padding: 20px; background: #e9f4ed; }
      .eyebrow { margin: 0 0 12px; color: #267352; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
      h2 { margin: 0; font-size: 22px; }
      .summary { margin: 10px 0 24px; color: #466158; font-size: 13px; line-height: 1.5; }
      button { border: 0; border-radius: 6px; padding: 10px 12px; background: #167a50; color: #ffffff; cursor: pointer; font: inherit; font-weight: 700; }
      .progress { margin: 16px 0 0; color: #267352; font-size: 13px; font-weight: 700; }
    `,
    script: `
      const progress = document.querySelector('#progress');
      const render = () => {
        const completed = Number(kritzel.state.completed ?? 0);
        progress.textContent = completed === 3 ? 'All three items are ready.' : completed + ' of 3 items complete';
      };
      document.querySelector('#progress-button').addEventListener('click', () => {
        const completed = Math.min(Number(kritzel.state.completed ?? 0) + 1, 3);
        kritzel.setState({ completed });
        render();
      });
      render();
    `,
  },
  {
    name: 'Focus timer',
    html: `
      <main class="card timer-card">
        <p class="eyebrow">Generated workspace</p>
        <h2>Focus timer</h2>
        <p class="summary">The mock response replaced the iframe definition without recreating the canvas object.</p>
        <div id="minutes" class="minutes"></div>
        <button id="add-button" type="button">Add five minutes</button>
      </main>
    `,
    css: `
      :root { color: #33234d; background: #f3effa; }
      .card { box-sizing: border-box; min-height: 100%; padding: 20px; background: #f3effa; }
      .eyebrow { margin: 0 0 12px; color: #7848a1; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
      h2 { margin: 0; font-size: 22px; }
      .summary { margin: 10px 0 20px; color: #625372; font-size: 13px; line-height: 1.5; }
      .minutes { margin-bottom: 20px; color: #7848a1; font-size: 34px; font-weight: 800; }
      button { border: 1px solid #7848a1; border-radius: 6px; padding: 10px 12px; background: #ffffff; color: #593278; cursor: pointer; font: inherit; font-weight: 700; }
    `,
    script: `
      const minutes = document.querySelector('#minutes');
      const render = () => {
        minutes.textContent = String(Number(kritzel.state.minutes ?? 25)) + ' min';
      };
      document.querySelector('#add-button').addEventListener('click', () => {
        kritzel.setState({ minutes: Number(kritzel.state.minutes ?? 25) + 5 });
        render();
      });
      render();
    `,
  },
];

function createInitialRuntimeIframeData(): RuntimeIframeData {
  return {
    definition: MOCK_COMPONENT_DEFINITIONS[0],
    state: { completed: 0 },
    revision: 0,
  };
}

function normalizeRuntimeIframeData(data: unknown): RuntimeIframeData {
  if (!data || typeof data !== 'object') {
    return createInitialRuntimeIframeData();
  }

  const candidate = data as Partial<RuntimeIframeData>;
  const definition = MOCK_COMPONENT_DEFINITIONS.find(item => item.name === candidate.definition?.name)
    ?? MOCK_COMPONENT_DEFINITIONS[0];

  return {
    definition,
    state: candidate.state && typeof candidate.state === 'object' ? { ...candidate.state } : {},
    revision: typeof candidate.revision === 'number' ? candidate.revision : 0,
  };
}

function createIframeDocument(data: RuntimeIframeData, cursors: RuntimeIframeCursors): string {
  const state = JSON.stringify(data.state).replace(/</g, '\\u003c');

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      :root {
        --kritzel-runtime-default-cursor: ${cursors.default};
        --kritzel-runtime-pointer-cursor: ${cursors.pointer};
      }
      html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; font-family: Roboto, sans-serif; cursor: var(--kritzel-runtime-default-cursor); }
      button, button * { cursor: var(--kritzel-runtime-pointer-cursor) !important; }
      ${data.definition.css}
    </style>
  </head>
  <body>
    ${data.definition.html}
    <script>
      const kritzel = {
        state: ${state},
        setState(nextState) {
          this.state = nextState;
          parent.postMessage({ type: '${RUNTIME_IFRAME_STATE_MESSAGE}', state: nextState }, '*');
        },
      };
      let bridgedPointerId = null;
      const interactiveSelector = 'button, input, textarea, select, a[href], [contenteditable="true"], [contenteditable=""]';
      const bridgePointerEvent = event => {
        parent.postMessage({
          type: '${RUNTIME_IFRAME_POINTER_MESSAGE}',
          eventType: event.type,
          pointerId: event.pointerId,
          pointerType: event.pointerType,
          clientX: event.clientX,
          clientY: event.clientY,
          button: event.button,
          buttons: event.buttons,
          shiftKey: event.shiftKey,
          ctrlKey: event.ctrlKey,
          altKey: event.altKey,
          metaKey: event.metaKey,
        }, '*');
      };
      document.addEventListener('pointerdown', event => {
        if (event.target.closest(interactiveSelector)) {
          return;
        }
        bridgedPointerId = event.pointerId;
        event.preventDefault();
        bridgePointerEvent(event);
      });
      document.addEventListener('pointermove', event => {
        if (event.pointerId === bridgedPointerId) {
          event.preventDefault();
          bridgePointerEvent(event);
        }
      });
      const finishPointerBridge = event => {
        if (event.pointerId === bridgedPointerId) {
          event.preventDefault();
          bridgePointerEvent(event);
          bridgedPointerId = null;
        }
      };
      document.addEventListener('pointerup', finishPointerBridge);
      document.addEventListener('pointercancel', finishPointerBridge);
      ${data.definition.script}
    </script>
  </body>
</html>`;
}

function createRuntimeIframeInstance(
  data: RuntimeIframeData,
  cursors: RuntimeIframeCursors,
  onStateChange: (state: Record<string, unknown>) => void,
): RuntimeIframeInstance {
  const iframe = document.createElement('iframe');
  iframe.sandbox.add('allow-scripts');
  iframe.title = `Sandboxed ${data.definition.name} component`;
  iframe.style.cssText = 'display:block; width:100%; height:100%; border:0;';

  const onMessage = (event: MessageEvent<unknown>) => {
    if (event.source !== iframe.contentWindow || !event.data || typeof event.data !== 'object') {
      return;
    }

    const message = event.data as { type?: unknown; state?: unknown };
    if (message.type === RUNTIME_IFRAME_POINTER_MESSAGE) {
      const pointerMessage = event.data as RuntimeIframePointerMessage;
      const iframeRect = iframe.getBoundingClientRect();
      iframe.dispatchEvent(new PointerEvent(pointerMessage.eventType, {
        bubbles: true,
        composed: true,
        cancelable: true,
        pointerId: pointerMessage.pointerId,
        pointerType: pointerMessage.pointerType,
        clientX: iframeRect.left + pointerMessage.clientX,
        clientY: iframeRect.top + pointerMessage.clientY,
        button: pointerMessage.button,
        buttons: pointerMessage.buttons,
        shiftKey: pointerMessage.shiftKey,
        ctrlKey: pointerMessage.ctrlKey,
        altKey: pointerMessage.altKey,
        metaKey: pointerMessage.metaKey,
      }));
      return;
    }

    if (message.type !== RUNTIME_IFRAME_STATE_MESSAGE || !message.state || typeof message.state !== 'object') {
      return;
    }

    onStateChange({ ...(message.state as Record<string, unknown>) });
  };

  window.addEventListener('message', onMessage);

  const render = (nextData: RuntimeIframeData) => {
    iframe.srcdoc = createIframeDocument(nextData, cursors);
  };
  render(data);

  return {
    iframe,
    destroy: () => {
      window.removeEventListener('message', onMessage);
      iframe.remove();
    },
    update: render,
  };
}

@Component({
  selector: 'app-dynamic-objects-iframe',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      <button type="button" (click)="applyMockLlmResponse()">Mock LLM response</button>
      <span>Replace the sandboxed component definition while preserving its canvas object.</span>
    </div>
    <kritzel-editor
      editorId="dynamic-objects-iframe"
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
    .toolbar { display: flex; align-items: center; gap: 12px; padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #ebebeb; font: 13px Roboto, sans-serif; }
    .toolbar button { border: 1px solid #dd0031; border-radius: 6px; padding: 6px 10px; background: #ffffff; color: #dd0031; cursor: pointer; font: inherit; font-weight: 700; }
    .toolbar span { color: #555; }
    kritzel-editor { flex: 1; min-height: 0; }
  `],
})
export class DynamicObjectsIframeComponent implements OnDestroy {
  private readonly mountedIframes = new Map<string, RuntimeIframeInstance>();
  private readonly runtimeObject = this.createRuntimeObject();

  themes = [angularThemeLight, angularThemeDark];
  workspaces = signal([
    new KritzelWorkspace({ objects: [this.runtimeObject] }),
  ]);

  constructor() {
    KritzelDynamicObjectRendererRegistry.register(RUNTIME_IFRAME_RENDERER_KEY, {
      onMount: ({ object, container, data }: RuntimeIframeRendererContext) => {
        if (!container) {
          return;
        }

        this.destroyMountedIframe(object.id, container);

        const runtimeData = normalizeRuntimeIframeData(data);
        const computedStyle = getComputedStyle(container);
        const defaultCursor = computedStyle.cursor || 'auto';
        const cursors: RuntimeIframeCursors = {
          default: defaultCursor,
          pointer: computedStyle.getPropertyValue('--kritzel-global-pointer-cursor').trim() || defaultCursor,
        };
        const instance = createRuntimeIframeInstance(runtimeData, cursors, state => {
          const currentData = normalizeRuntimeIframeData(object.rendererData);
          object.rendererData = { ...currentData, state };
        });

        this.mountedIframes.set(object.id, instance);
        container.innerHTML = '';
        container.appendChild(instance.iframe);
      },
      onSerialize: ({ data }: RuntimeIframeRendererContext) => {
        return this.getCurrentRuntimeData(data);
      },
      onUnmount: ({ object, container, data }: RuntimeIframeRendererContext) => {
        const nextData = this.getCurrentRuntimeData(data);
        this.destroyMountedIframe(object.id, container);

        return nextData;
      },
    });
  }

  applyMockLlmResponse(): void {
    const currentData = this.getCurrentRuntimeData(this.runtimeObject.rendererData);
    const nextIndex = (MOCK_COMPONENT_DEFINITIONS.indexOf(currentData.definition) + 1) % MOCK_COMPONENT_DEFINITIONS.length;
    const nextData: RuntimeIframeData = {
      definition: MOCK_COMPONENT_DEFINITIONS[nextIndex],
      state: nextIndex === 0 ? { completed: 0 } : { minutes: 25 },
      revision: currentData.revision + 1,
    };

    this.runtimeObject.rendererData = nextData;
    this.mountedIframes.get(this.runtimeObject.id)?.update(nextData);
    this.runtimeObject.update();
  }

  private createRuntimeObject(): KritzelDynamicObject {
    const placeholder = document.createElement('div');
    placeholder.textContent = 'Loading sandbox...';

    const dynamicObject = new KritzelDynamicObject({
      element: placeholder,
      rendererKey: RUNTIME_IFRAME_RENDERER_KEY,
      rendererData: createInitialRuntimeIframeData(),
      translateX: -180,
      translateY: -120,
      width: 360,
      height: 240,
    });

    dynamicObject.isRotatable = false;

    return dynamicObject;
  }

  private getCurrentRuntimeData(data: unknown): RuntimeIframeData {
    return normalizeRuntimeIframeData(data);
  }

  private destroyMountedIframe(objectId: string, container: HTMLElement | null): void {
    const instance = this.mountedIframes.get(objectId);

    if (instance) {
      instance.destroy();
      this.mountedIframes.delete(objectId);
    }

    if (container) {
      container.innerHTML = '';
    }
  }

  ngOnDestroy(): void {
    this.mountedIframes.forEach(instance => instance.destroy());
    this.mountedIframes.clear();

    KritzelDynamicObjectRendererRegistry.unregister(RUNTIME_IFRAME_RENDERER_KEY);
  }
}