// TEMP: demo of KritzelChatSession in command mode against a mocked server answered by a real model; delete with pages/temp/.
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { KritzelBaseObject, KritzelChatBoxChip, KritzelChatSession, KritzelEditor, KritzelWorkspace } from '@kritzel/angular-editor';
import { ToolbarComponent } from '../../components/toolbar.component';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { createSeedObjects } from '../../const/seed-objects';
import { llmTransport } from './mock-llm-chat-server';

const SYSTEM = 'You draw on a whiteboard. Look at the canvas before you change it. Keep answers short.';

@Component({
  selector: 'app-temp-command-mode',
  imports: [KritzelEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <span class="label">Command mode</span>
      <span class="status">Try “Draw a flowchart of a release”, “Add a note: ship v2”, or select objects and ask “make them blue”.</span>
    </app-toolbar>
    <p class="info">
      The model works as you: changes are instant, change your selection, and Ctrl+Z takes back a whole prompt.
      <span class="answer" aria-live="polite">{{ answer() ? 'Assistant: ' + answer() : '' }}</span>
    </p>
    <div class="editor">
      <kritzel-editor
        editorId="temp-command-mode"
        [theme]="'light'"
        [themes]="themes"
        [workspaces]="workspaces"
        [user]="user"
        [isChatBoxVisible]="true"
        [chatSession]="session"
        [chatBoxChips]="chips()"
        [isMoreMenuVisible]="false"
        [isWorkspaceManagerVisible]="false"
        (objectsSelectionChange)="onSelectionChange($event.detail)"
        (chatChipRemove)="onChipRemove($event.detail)"
      ></kritzel-editor>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        font-family: Roboto, sans-serif;
      }
      .info {
        margin: 0;
        padding: 6px 12px;
        font-size: 13px;
        color: #555;
        border-bottom: 1px solid #ebebeb;
      }
      .answer {
        margin-left: 12px;
        color: #7c3aed;
      }
      .editor {
        flex: 1;
        min-height: 0;
        position: relative;
      }
    `,
  ],
})
export class TempCommandModeComponent {
  themes = [angularThemeLight, angularThemeDark];
  workspaces = [new KritzelWorkspace({ objects: createSeedObjects(), viewport: { centerWorldX: 200, centerWorldY: 280, scale: 0.7 } })];
  user = { id: 'demo-user', name: 'Demo User' };

  // No agent: the session works as the user (command mode).
  readonly session = new KritzelChatSession({ transport: llmTransport, system: SYSTEM });

  chips = signal<KritzelChatBoxChip[]>([]);
  answer = signal('');

  constructor() {
    // Show the newest answer, and how a prompt ended unless it completed (e.g. stopped or failed).
    const offMessage = this.session.on('message', message => {
      const text = message.parts.map(part => (part.type === 'text' ? part.text : '')).join(' ').trim();
      if (message.role === 'assistant' && text) this.answer.set(text);
    });
    const offEnd = this.session.on('end', ({ status, error }) => {
      if (status === 'error') console.error('[temp command mode]', error);
      if (status !== 'completed') this.answer.set(status === 'error' ? `(error: ${errorMessage(error)})` : `(${status})`);
    });
    inject(DestroyRef).onDestroy(() => (offMessage(), offEnd()));
  }

  onSelectionChange(objects: KritzelBaseObject[]): void {
    this.chips.set(
      objects.map(object => ({
        id: object.id,
        objectId: object.id,
        label: object.name || object.__class__.replace('Kritzel', ''),
        icon: 'cursor',
      })),
    );
  }

  onChipRemove(chip: KritzelChatBoxChip): void {
    this.chips.update(chips => chips.filter(item => item.id !== chip.id));
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
