// TEMP: demo of the two modes of KritzelChatSession against a mocked server; delete with pages/temp/.
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import {
  KritzelAgent,
  KritzelBaseObject,
  KritzelChatBoxChip,
  KritzelChatSession,
  KritzelEditor,
  KritzelWorkspace,
} from '@kritzel/angular-editor';
import { ToolbarComponent } from '../../components/toolbar.component';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { createSeedObjects } from '../../const/seed-objects';
import { mockTransport } from './mock-chat-server';

type Mode = 'command' | 'agent';

const SYSTEM = 'You draw on a whiteboard. Look at the canvas before you change it. Keep answers short.';

@Component({
  selector: 'app-temp-chat-modes',
  imports: [KritzelEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <span class="label">Chat modes</span>
      <button [attr.aria-pressed]="mode() === 'command'" [disabled]="mode() === 'command'" (click)="mode.set('command'); answer.set('')">
        Command mode
      </button>
      <button [attr.aria-pressed]="mode() === 'agent'" [disabled]="mode() === 'agent'" (click)="mode.set('agent'); answer.set('')">
        Agent mode
      </button>
      <span class="status">Try “Draw a flowchart”, “Add a note: ship v2”, or select an object and ask “make it blue”.</span>
    </app-toolbar>
    <p class="info">
      {{ about[mode()] }}
      <span class="answer" aria-live="polite">{{ answer() ? 'Assistant: ' + answer() : '' }}</span>
    </p>
    <div class="editor">
      <kritzel-editor
        editorId="temp-chat-modes"
        [theme]="'light'"
        [themes]="themes"
        [workspaces]="workspaces"
        [user]="user"
        [isChatBoxVisible]="true"
        [chatSession]="sessions[mode()]"
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
export class TempChatModesComponent {
  readonly about: Record<Mode, string> = {
    command: 'The model works as you: changes are instant, change your selection, and Ctrl+Z takes back a whole prompt.',
    agent: 'The model works as Assistant: its own cursor, selection and history. It leaves what you have selected alone.',
  };

  themes = [angularThemeLight, angularThemeDark];
  // Zoomed out and shifted down, so the builds below the seed objects (and the agent's cursor) stay in view.
  workspaces = [new KritzelWorkspace({ objects: createSeedObjects(), viewport: { centerWorldX: 200, centerWorldY: 280, scale: 0.7 } })];
  user = { id: 'demo-user', name: 'Demo User' };

  // One session per mode, created once; the toggle binds the other one.
  readonly sessions: Record<Mode, KritzelChatSession> = {
    command: new KritzelChatSession({ transport: mockTransport, system: SYSTEM }),
    agent: new KritzelChatSession({
      transport: mockTransport,
      system: SYSTEM,
      agent: new KritzelAgent({ id: 'assistant', name: 'Assistant', color: '#7C3AED' }),
    }),
  };

  mode = signal<Mode>('command');
  chips = signal<KritzelChatBoxChip[]>([]);
  answer = signal('');

  constructor() {
    // Show the newest answer of either session, and how a prompt ended unless it completed (e.g. stopped).
    const destroyRef = inject(DestroyRef);
    for (const session of Object.values(this.sessions)) {
      const offMessage = session.on('message', message => {
        const text = message.parts.map(part => (part.type === 'text' ? part.text : '')).join(' ').trim();
        if (message.role === 'assistant' && text) this.answer.set(text);
      });
      const offEnd = session.on('end', ({ status }) => {
        if (status !== 'completed') this.answer.set(`(${status})`);
      });
      destroyRef.onDestroy(() => (offMessage(), offEnd()));
    }
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
