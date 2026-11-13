import { ChangeDetectionStrategy, Component, computed, effect, signal, ViewChild } from '@angular/core';
import {
  KritzelBaseObject,
  KritzelChatBoxChip,
  KritzelChatSession,
  KritzelEditor,
  KritzelObjectTitlebarActionEvent,
  KritzelWorkspace,
} from '@kritzel/angular-editor';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { createBrowserTransport, type Credentials } from './browser-transport';
import {
  createGenerativeUiSession,
  createUiDocument,
  getErrorMessage,
  getUiChips,
  getUiTitle,
  isUi,
  objectConfig,
  objectTitlebar,
  withUiFrames,
  type RequestMode,
} from './generative-ui';
import { createMockTransport } from './mock-transport';
import { UiPreviewComponent } from './ui-preview.component';
import { WelcomePanelComponent } from './welcome-panel.component';

@Component({
  selector: 'app-generative-ui',
  imports: [KritzelEditor, UiPreviewComponent, WelcomePanelComponent],
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
      [chatSession]="session()"
      [chatBoxChips]="chips()"
      [isChatBoxVisible]="mode() === 'mock' || credentials() !== null"
      [isToolbarVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (objectsChange)="onObjectsChange($event)"
      (objectsSelectionChange)="onSelectionChange($event)"
      (chatChipRemove)="onChipRemove($event)"
      (objectTitlebarAction)="onTitlebarAction($event)"
    ></kritzel-editor>

    <app-welcome-panel
      [isVisible]="!hasUis() && !isWorking()"
      [mode]="mode()"
      [credentials]="credentials()"
      [error]="keyError()"
      (modeChange)="changeMode($event)"
      (connected)="connect($event)"
      (disconnect)="disconnect()"
      (example)="sendExample($event)"
    />

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

  readonly themes = [withUiFrames(angularThemeLight), withUiFrames(angularThemeDark)];
  readonly accentColor = angularThemeLight.global?.primaryColor;
  readonly accentHoverColor = angularThemeLight.global?.primaryHoverColor;
  readonly workspaces = [new KritzelWorkspace({ name: 'Generative UI', objects: [] })];
  readonly objectConfig = objectConfig;
  readonly objectTitlebar = objectTitlebar;

  // The key only lives in this component's memory: it is gone when the page reloads.
  readonly credentials = signal<Credentials | null>(null);
  // One session per mode, created once: choosing a mode binds its session to the editor.
  private readonly browser = createBrowserTransport();
  private readonly sessions: Record<RequestMode, KritzelChatSession> = {
    live: createGenerativeUiSession(this.browser.transport),
    mock: createGenerativeUiSession(createMockTransport()),
  };
  readonly mode = signal<RequestMode | null>(null);
  readonly keyError = signal('');
  readonly hasUis = signal(false);
  readonly chips = signal<KritzelChatBoxChip[]>([]);
  readonly preview = signal<{ title: string; document: string } | null>(null);
  readonly session = computed(() => {
    const mode = this.mode();
    return mode ? this.sessions[mode] : null;
  });
  readonly isWorking = signal(false);

  constructor() {
    // Follows the bound session. The chat box shows the progress of a prompt, but not why it failed.
    effect(onCleanup => {
      const session = this.session();
      this.isWorking.set(session?.running ?? false);
      if (!session) {
        return;
      }
      const offChange = session.on('change', () => this.isWorking.set(session.running));
      const offEnd = session.on('end', result => {
        if (result.status === 'error') {
          void this.editor?.triggerNotification({ type: 'error', message: getErrorMessage(result.error) });
        }
      });
      onCleanup(() => {
        offChange();
        offEnd();
      });
    });
  }

  sendExample(prompt: string) {
    if (this.mode() === 'live' && !this.credentials()) {
      this.keyError.set('Add an API key to start generating UIs.');
      return;
    }
    void this.session()?.send(prompt);
  }

  connect(credentials: Credentials) {
    this.browser.setCredentials(credentials);
    this.credentials.set(credentials);
    this.keyError.set('');
  }

  disconnect() {
    this.browser.setCredentials(null);
    this.credentials.set(null);
  }

  changeMode(mode: RequestMode | null) {
    this.mode.set(mode);
    this.keyError.set('');
  }

  onObjectsChange(event: CustomEvent<KritzelBaseObject[]>) {
    this.hasUis.set(event.detail.some(isUi));
  }

  onSelectionChange(event: CustomEvent<KritzelBaseObject[]>) {
    this.chips.set(getUiChips(event.detail));
  }

  onChipRemove(event: CustomEvent<KritzelChatBoxChip>) {
    this.chips.update(chips => chips.filter(chip => chip.id !== event.detail.id));
  }

  async onTitlebarAction(event: CustomEvent<KritzelObjectTitlebarActionEvent>) {
    const { elementId, objectId } = event.detail;
    const ui = await this.editor.getObjectById(objectId);
    if (elementId === 'play' && ui && isUi(ui) && !ui.isLoading) {
      this.preview.set({ title: getUiTitle(ui), document: createUiDocument(ui.content, getUiTitle(ui)) });
    }
  }
}
