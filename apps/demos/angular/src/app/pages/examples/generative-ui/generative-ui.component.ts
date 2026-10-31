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
import type { Credentials } from './llm-providers';
import { UiPreviewComponent } from './ui-preview.component';
import { WelcomePanelComponent } from './welcome-panel.component';

@Component({
  selector: 'app-generative-ui',
  imports: [KritzelEditor, UiPreviewComponent, WelcomePanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      editorId="generative-ui"
      [theme]="'light'"
      [themes]="themes"
      [workspaces]="workspaces"
      [objectConfig]="objectConfig"
      [objectTitlebar]="objectTitlebar"
      [isChatBoxVisible]="true"
      [isChatBoxLoading]="isWorking()"
      [isWorkspaceManagerVisible]="false"
      (isReady)="onReady()"
      (chatSubmit)="generate($event.detail)"
      (chatStop)="stop()"
      (objectsChange)="onObjectsChange($event)"
      (objectTitlebarAction)="onTitlebarAction($event)"
    ></kritzel-editor>

    <app-welcome-panel
      [isVisible]="!hasUis() && !isWorking()"
      [credentials]="credentials()"
      [error]="keyError()"
      (connected)="connect($event)"
      (disconnect)="credentials.set(null)"
      (example)="generate($event)"
    />

    @if (preview(); as current) {
      <app-ui-preview [title]="current.title" [document]="current.document" (closed)="preview.set(null)" />
    }
  `,
  styles: [`
    :host {
      --gen-ui-accent: #dd0031;
      --gen-ui-accent-hover: #b70028;
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
  readonly workspaces = [new KritzelWorkspace({ name: 'Generative UI', objects: [] })];
  readonly objectConfig = objectConfig;
  readonly objectTitlebar = objectTitlebar;

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

  async generate(prompt: string) {
    const credentials = this.credentials();
    if (!this.generator || this.abort || !prompt.trim()) {
      return;
    }
    if (!credentials) {
      this.keyError.set('Add an API key to start generating UIs.');
      return;
    }

    const abort = new AbortController();
    this.abort = abort;
    this.isWorking.set(true);
    try {
      await this.generator.generate(prompt, credentials, abort.signal);
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
