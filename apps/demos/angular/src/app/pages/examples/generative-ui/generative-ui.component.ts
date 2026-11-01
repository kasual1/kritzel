import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import {
  KritzelBaseObject,
  KritzelEditor,
  KritzelObjectTitlebarActionEvent,
  KritzelWorkspace,
} from '@kritzel/angular-editor';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { createUiDocument, GenerativeUi, getUiTitle, isUi, objectConfig, objectTitlebar } from './generative-ui';
import { complete, type CompletionRequest, type Credentials } from './llm-providers';
import { MockChatBoxComponent } from './mock-chat-box.component';
import { completeWithMock, type MockUi, type RequestMode } from './mock-uis';
import { UiPreviewComponent } from './ui-preview.component';
import { WelcomePanelComponent } from './welcome-panel.component';

@Component({
  selector: 'app-generative-ui',
  imports: [KritzelEditor, MockChatBoxComponent, UiPreviewComponent, WelcomePanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The welcome guide takes its accent from the theme, like the editor's own controls.
  host: {
    '[style.--gen-ui-accent]': 'accentColor',
    '[style.--gen-ui-accent-hover]': 'accentHoverColor',
  },
  template: `
    <kritzel-editor
      editorId="generative-ui"
      [theme]="'light'"
      [themes]="themes"
      [workspaces]="workspaces"
      [objectConfig]="objectConfig"
      [objectTitlebar]="objectTitlebar"
      [isChatBoxVisible]="mode() === 'live'"
      [isChatBoxLoading]="isWorking()"
      [isToolbarVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (isReady)="onReady()"
      (chatSubmit)="generate($event.detail)"
      (chatStop)="stop()"
      (objectsChange)="onObjectsChange($event)"
      (objectTitlebarAction)="onTitlebarAction($event)"
    ></kritzel-editor>

    <app-welcome-panel
      [isVisible]="!hasUis() && !isWorking()"
      [mode]="mode()"
      [credentials]="credentials()"
      [error]="keyError()"
      (modeChange)="changeMode($event)"
      (connected)="connect($event)"
      (disconnect)="credentials.set(null)"
      (example)="generate($event)"
    />

    @if (mode() === 'mock') {
      <app-mock-chat-box [isWorking]="isWorking()" (send)="generateMock($event)" />
    }

    @if (preview(); as current) {
      <app-ui-preview [title]="current.title" [document]="current.document" (closed)="preview.set(null)" />
    }
  `,
  styles: [`
    :host {
      position: relative;
      display: block;
      height: 100%;
      font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
      /* UIs resize from their corners like frames in a design tool, without the corner squares. */
      --kritzel-selection-resize-handle-visibility: hidden;
    }

    kritzel-editor {
      display: block;
      width: 100%;
      height: 100%;
    }
  `],
})
export class GenerativeUiComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  readonly themes = [angularThemeLight, angularThemeDark];
  readonly accentColor = angularThemeLight.global?.primaryColor;
  readonly accentHoverColor = angularThemeLight.global?.primaryHoverColor;
  readonly workspaces = [new KritzelWorkspace({ name: 'Generative UI', objects: [] })];
  readonly objectConfig = objectConfig;
  readonly objectTitlebar = objectTitlebar;

  readonly mode = signal<RequestMode | null>(null);
  // The key only lives in this component's memory: it is gone when the page reloads.
  readonly credentials = signal<Credentials | null>(null);
  readonly keyError = signal('');
  readonly isWorking = signal(false);
  readonly hasUis = signal(false);
  readonly preview = signal<{ title: string; document: string } | null>(null);

  private generator: GenerativeUi | null = null;
  private abort: AbortController | null = null;

  onReady() {
    this.generator = new GenerativeUi(this.editor);
  }

  generate(prompt: string) {
    const credentials = this.credentials();
    if (!credentials) {
      this.keyError.set('Add an API key to start generating UIs.');
      return;
    }
    void this.run(prompt, request => complete(credentials, request));
  }

  /** A mocked prompt always adds a new UI, because its answer is not a change of the selected one. */
  async generateMock(ui: MockUi) {
    await this.editor.clearSelection();
    await this.run(ui.prompt, () => completeWithMock(ui));
  }

  private async run(prompt: string, completion: (request: CompletionRequest) => Promise<string>) {
    if (!this.generator || this.abort || !prompt.trim()) {
      return;
    }

    const abort = new AbortController();
    this.abort = abort;
    this.isWorking.set(true);
    try {
      await this.generator.generate(prompt, completion, abort.signal);
    } catch (error) {
      if (!abort.signal.aborted) {
        const message = error instanceof Error ? error.message : String(error);
        await this.editor.triggerNotification({ type: 'error', message });
      }
    } finally {
      this.abort = null;
      this.isWorking.set(false);
    }
  }

  stop() {
    this.abort?.abort();
  }

  connect(credentials: Credentials) {
    this.credentials.set(credentials);
    this.keyError.set('');
  }

  changeMode(mode: RequestMode | null) {
    this.mode.set(mode);
    this.keyError.set('');
  }

  onObjectsChange(event: CustomEvent<KritzelBaseObject[]>) {
    this.hasUis.set(event.detail.some(isUi));
  }

  async onTitlebarAction(event: CustomEvent<KritzelObjectTitlebarActionEvent>) {
    const { elementId, objectId } = event.detail;
    const ui = await this.editor.getObjectById(objectId);
    if (elementId === 'play' && ui && isUi(ui) && !ui.isLoading) {
      this.preview.set({ title: getUiTitle(ui), document: createUiDocument(ui.content, getUiTitle(ui)) });
    }
  }
}
