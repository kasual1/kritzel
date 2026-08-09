import { ChangeDetectionStrategy, Component, OnDestroy, ViewChild } from '@angular/core';

import {
  EditorIsReadyEvent,
  KritzelCustomElement,
  KritzelCustomElementRendererRegistry,
  KritzelEditor,
} from 'kritzel-angular';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { angularThemeLight } from '../../const/angular-theme-light';

const HTML_RENDERER_KEY = 'angular-interactive-html';

type HtmlRendererContext = {
  object: KritzelCustomElement;
  container: HTMLElement | null;
  data?: unknown;
};

type HtmlWidgetState = {
  title: string;
  notes: string;
  isPinned: boolean;
  clickCount: number;
};

type MountedHtmlWidget = {
  root: HTMLElement;
  getState: () => HtmlWidgetState;
  destroy: () => void;
};

const DEFAULT_HTML_WIDGET_STATE: HtmlWidgetState = {
  title: 'Interactive HTML Card',
  notes: 'Edit this text and click buttons. State persists in rendererData.',
  isPinned: false,
  clickCount: 0,
};

function createInitialHtmlWidgetState(): HtmlWidgetState {
  return {
    ...DEFAULT_HTML_WIDGET_STATE,
  };
}

function normalizeHtmlWidgetState(data: unknown): HtmlWidgetState {
  if (!data || typeof data !== 'object') {
    return createInitialHtmlWidgetState();
  }

  const candidate = data as Partial<HtmlWidgetState>;

  return {
    title:
      typeof candidate.title === 'string' && candidate.title.trim().length > 0
        ? candidate.title
        : DEFAULT_HTML_WIDGET_STATE.title,
    notes: typeof candidate.notes === 'string' ? candidate.notes : DEFAULT_HTML_WIDGET_STATE.notes,
    isPinned: typeof candidate.isPinned === 'boolean' ? candidate.isPinned : DEFAULT_HTML_WIDGET_STATE.isPinned,
    clickCount: typeof candidate.clickCount === 'number' && candidate.clickCount >= 0 ? candidate.clickCount : 0,
  };
}

function createInteractiveHtmlWidget(initialState: HtmlWidgetState): MountedHtmlWidget {
  const root = document.createElement('section');
  root.style.cssText = [
    'display:flex',
    'flex-direction:column',
    'gap:12px',
    'padding:14px',
    'border:1px solid #d8dbe1',
    'border-radius:10px',
    'background:#ffffff',
    'font-family:ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    'color:#1f2937',
    'height:100%',
    'box-sizing:border-box',
  ].join(';');

  const heading = document.createElement('h3');
  heading.textContent = 'Pure HTML Controls';
  heading.style.cssText = 'margin:0; font-size:16px; font-weight:700;';

  const titleLabel = document.createElement('label');
  titleLabel.textContent = 'Title';
  titleLabel.style.cssText = 'display:flex; flex-direction:column; gap:6px; font-size:13px;';

  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.value = initialState.title;
  titleInput.style.cssText =
    'border:1px solid #cbd5e1; border-radius:8px; padding:8px; font:inherit; color:inherit;';

  const notesLabel = document.createElement('label');
  notesLabel.textContent = 'Notes';
  notesLabel.style.cssText = 'display:flex; flex-direction:column; gap:6px; font-size:13px;';

  const notesInput = document.createElement('textarea');
  notesInput.value = initialState.notes;
  notesInput.rows = 4;
  notesInput.style.cssText =
    'border:1px solid #cbd5e1; border-radius:8px; padding:8px; font:inherit; color:inherit; resize:vertical;';

  const pinnedWrapper = document.createElement('label');
  pinnedWrapper.style.cssText = 'display:flex; align-items:center; gap:8px; font-size:13px;';

  const pinnedCheckbox = document.createElement('input');
  pinnedCheckbox.type = 'checkbox';
  pinnedCheckbox.checked = initialState.isPinned;

  const pinnedText = document.createElement('span');
  pinnedText.textContent = 'Pin this card';

  pinnedWrapper.appendChild(pinnedCheckbox);
  pinnedWrapper.appendChild(pinnedText);

  const actions = document.createElement('div');
  actions.style.cssText = 'display:flex; gap:8px; flex-wrap:wrap;';

  const incrementButton = document.createElement('button');
  incrementButton.type = 'button';
  incrementButton.textContent = 'Count +1';
  incrementButton.style.cssText =
    'border:1px solid #cbd5e1; background:#f8fafc; color:#0f172a; border-radius:8px; padding:8px 10px; cursor:pointer;';

  const resetButton = document.createElement('button');
  resetButton.type = 'button';
  resetButton.textContent = 'Reset Count';
  resetButton.style.cssText =
    'border:1px solid #cbd5e1; background:#f1f5f9; color:#0f172a; border-radius:8px; padding:8px 10px; cursor:pointer;';

  const status = document.createElement('p');
  status.style.cssText = 'margin:0; font-size:13px; color:#334155;';

  let clickCount = initialState.clickCount;

  const renderStatus = () => {
    status.textContent = `Clicks: ${clickCount} | Pinned: ${pinnedCheckbox.checked ? 'yes' : 'no'}`;
  };

  const onIncrement = () => {
    clickCount += 1;
    renderStatus();
  };

  const onReset = () => {
    clickCount = 0;
    renderStatus();
  };

  const onPinnedChange = () => {
    renderStatus();
  };

  incrementButton.addEventListener('click', onIncrement);
  resetButton.addEventListener('click', onReset);
  pinnedCheckbox.addEventListener('change', onPinnedChange);

  actions.appendChild(incrementButton);
  actions.appendChild(resetButton);

  titleLabel.appendChild(titleInput);
  notesLabel.appendChild(notesInput);

  root.appendChild(heading);
  root.appendChild(titleLabel);
  root.appendChild(notesLabel);
  root.appendChild(pinnedWrapper);
  root.appendChild(actions);
  root.appendChild(status);

  renderStatus();

  return {
    root,
    getState: () => ({
      title: titleInput.value,
      notes: notesInput.value,
      isPinned: pinnedCheckbox.checked,
      clickCount,
    }),
    destroy: () => {
      incrementButton.removeEventListener('click', onIncrement);
      resetButton.removeEventListener('click', onReset);
      pinnedCheckbox.removeEventListener('change', onPinnedChange);
    },
  };
}

@Component({
  selector: 'app-editor-page-custom-element-html',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      [theme]="'light'"
      [themes]="themes"
      (isReady)="onReady($event)"
    ></kritzel-editor>
  `,
})
export class EditorPageCustomElementHtmlComponent implements OnDestroy {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  private readonly mountedWidgets = new Map<string, MountedHtmlWidget>();
  private hasAddedInitialCustomElement = false;

  themes = [angularThemeLight, angularThemeDark];

  constructor() {
    KritzelCustomElementRendererRegistry.register(HTML_RENDERER_KEY, {
      onMount: ({ object, container, data }: HtmlRendererContext) => {
        if (!container) {
          return;
        }

        const previous = this.mountedWidgets.get(object.id);
        if (previous) {
          previous.destroy();
          previous.root.remove();
          this.mountedWidgets.delete(object.id);
        }

        const initialState = normalizeHtmlWidgetState(data);
        const mountedWidget = createInteractiveHtmlWidget(initialState);

        container.innerHTML = '';
        container.appendChild(mountedWidget.root);

        this.mountedWidgets.set(object.id, mountedWidget);
      },
      onUnmount: ({ object, container }: HtmlRendererContext) => {
        const mountedWidget = this.mountedWidgets.get(object.id);

        if (!mountedWidget) {
          return undefined;
        }

        const state = mountedWidget.getState();
        mountedWidget.destroy();
        mountedWidget.root.remove();
        this.mountedWidgets.delete(object.id);

        if (container) {
          container.innerHTML = '';
        }

        return state;
      },
    });
  }

  async onReady(_event: CustomEvent<EditorIsReadyEvent>): Promise<void> {
    if (this.hasAddedInitialCustomElement) {
      return;
    }

    const objectCount = await this.editor.getObjectsTotalCount();
    if (objectCount > 0) {
      return;
    }

    this.hasAddedInitialCustomElement = true;

    const placeholder = document.createElement('div');
    placeholder.textContent = 'Loading Interactive HTML...';

    const customElement = new KritzelCustomElement({
      element: placeholder,
      rendererKey: HTML_RENDERER_KEY,
      rendererData: createInitialHtmlWidgetState(),
      translateX: -320,
      translateY: -200,
      width: 640,
      height: 420,
    });

    customElement.isRotatable = false;

    await this.editor.addObject(customElement);
  }

  ngOnDestroy(): void {
    this.mountedWidgets.forEach((mountedWidget) => {
      mountedWidget.destroy();
      mountedWidget.root.remove();
    });
    this.mountedWidgets.clear();

    KritzelCustomElementRendererRegistry.unregister(HTML_RENDERER_KEY);
  }
}
