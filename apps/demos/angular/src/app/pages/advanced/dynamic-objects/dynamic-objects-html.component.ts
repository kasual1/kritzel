import { ChangeDetectionStrategy, Component, OnDestroy, signal } from '@angular/core';

import {
  KritzelDynamicObject,
  KritzelDynamicObjectRendererRegistry,
  KritzelEditor,
  KritzelWorkspace,
} from '@kritzel/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';

const HTML_COUNTER_RENDERER_KEY = 'angular-dynamic-object-html-counter';

interface HtmlCounterState {
  count: number;
}

interface HtmlCounterRendererContext {
  object: KritzelDynamicObject;
  container: HTMLElement | null;
  data?: unknown;
}

interface HtmlCounterInstance {
  element: HTMLElement;
  destroy(): void;
  getState(): HtmlCounterState;
}

const DEFAULT_HTML_COUNTER_STATE: HtmlCounterState = { count: 0 };

function createHtmlCounterInitialState(): HtmlCounterState {
  return { ...DEFAULT_HTML_COUNTER_STATE };
}

function normalizeHtmlCounterState(data: unknown): HtmlCounterState {
  if (!data || typeof data !== 'object') {
    return createHtmlCounterInitialState();
  }

  const count = (data as Partial<HtmlCounterState>).count;
  return {
    count: typeof count === 'number' && Number.isFinite(count)
      ? count
      : DEFAULT_HTML_COUNTER_STATE.count,
  };
}

function createHtmlCounterElement(initialState: HtmlCounterState): HtmlCounterInstance {
  const root = document.createElement('section');
  root.style.cssText = [
    'display:flex',
    'flex-direction:column',
    'gap:10px',
    'padding:14px',
    'box-sizing:border-box',
    'height:100%',
    'font-family:Roboto, sans-serif',
  ].join(';');

  const heading = document.createElement('h3');
  heading.textContent = 'Native HTML Counter';
  heading.style.cssText = 'margin:0; font-size:15px;';

  const note = document.createElement('p');
  note.textContent = 'This content is plain DOM rebuilt from renderer state, so copy/paste keeps behavior.';
  note.style.cssText = 'margin:0; font-size:12px; color:#555;';

  const controls = document.createElement('div');
  controls.style.cssText = 'display:flex; align-items:center; gap:12px; margin-top:auto;';

  const decrementButton = document.createElement('button');
  decrementButton.type = 'button';
  decrementButton.textContent = '-';

  const countLabel = document.createElement('span');
  countLabel.style.cssText = 'font-size:20px; font-weight:700; min-width:24px; text-align:center;';

  const incrementButton = document.createElement('button');
  incrementButton.type = 'button';
  incrementButton.textContent = '+';

  [decrementButton, incrementButton].forEach((button) => {
    button.style.cssText =
      'width:32px; height:32px; border-radius:6px; border:1px solid #dd0031; background:#ffffff; color:#dd0031; cursor:pointer; font-size:16px;';
  });

  let count = initialState.count;
  const renderCount = () => {
    countLabel.textContent = String(count);
  };
  renderCount();

  const increment = () => {
    count += 1;
    renderCount();
  };
  const decrement = () => {
    count -= 1;
    renderCount();
  };

  incrementButton.addEventListener('click', increment);
  decrementButton.addEventListener('click', decrement);

  controls.appendChild(decrementButton);
  controls.appendChild(countLabel);
  controls.appendChild(incrementButton);

  root.appendChild(heading);
  root.appendChild(note);
  root.appendChild(controls);

  return {
    element: root,
    destroy: () => {
      incrementButton.removeEventListener('click', increment);
      decrementButton.removeEventListener('click', decrement);
    },
    getState: () => ({ count }),
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
  private readonly mountedCounters = new Map<string, HtmlCounterInstance>();

  themes = [angularThemeLight, angularThemeDark];
  workspaces = signal([
    new KritzelWorkspace({ objects: [this.createInitialDynamicObject()] }),
  ]);

  constructor() {
    const renderer = {
      onMount: ({ object, container, data }: HtmlCounterRendererContext) => {
        if (!container) {
          return;
        }

        this.destroyMountedCounter(object.id, container);

        const instance = createHtmlCounterElement(normalizeHtmlCounterState(data));
        this.mountedCounters.set(object.id, instance);

        container.innerHTML = '';
        container.appendChild(instance.element);
      },
      onSerialize: ({ object, data }: HtmlCounterRendererContext) => {
        return this.mountedCounters.get(object.id)?.getState() ?? normalizeHtmlCounterState(data);
      },
      onUnmount: ({ object, container, data }: HtmlCounterRendererContext) => {
        const nextState = this.mountedCounters.get(object.id)?.getState() ?? normalizeHtmlCounterState(data);
        this.destroyMountedCounter(object.id, container);

        return nextState;
      },
    };

    KritzelDynamicObjectRendererRegistry.register(HTML_COUNTER_RENDERER_KEY, renderer);
  }

  private createInitialDynamicObject(): KritzelDynamicObject {
    const placeholder = document.createElement('div');
    placeholder.textContent = 'Loading Counter...';

    const dynamicObject = new KritzelDynamicObject({
      element: placeholder,
      rendererKey: HTML_COUNTER_RENDERER_KEY,
      rendererData: createHtmlCounterInitialState(),
      translateX: -150,
      translateY: -90,
      width: 260,
      height: 160,
    });

    dynamicObject.isRotatable = false;

    return dynamicObject;
  }

  private destroyMountedCounter(objectId: string, container: HTMLElement | null): void {
    const instance = this.mountedCounters.get(objectId);

    if (instance) {
      instance.destroy();
      this.mountedCounters.delete(objectId);
    }

    if (container) {
      container.innerHTML = '';
    }
  }

  ngOnDestroy(): void {
    this.mountedCounters.forEach((instance) => {
      instance.destroy();
    });
    this.mountedCounters.clear();

    KritzelDynamicObjectRendererRegistry.unregister(HTML_COUNTER_RENDERER_KEY);
  }
}
