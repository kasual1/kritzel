import { ChangeDetectionStrategy, Component, OnDestroy, computed, signal } from '@angular/core';
import {
  KritzelAgent,
  KritzelBaseObject,
  KritzelChatBoxChip,
  KritzelChatMessage,
  KritzelChatSession,
  KritzelEditor,
  KritzelWorkspace,
} from '@kritzel/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';
import { ToolbarComponent } from '../../../components/toolbar.component';
import { createDemoTransport, SLOW_PHRASE } from './chat-session-script';

type Mode = 'user' | 'agent';

const SYSTEM = 'You draw on a whiteboard. Keep answers short.';

/** One line of the transcript: who wrote it and what. */
function describe(message: KritzelChatMessage): string {
  return message.parts
    .map(part => {
      if (part.type === 'text') return part.text;
      if (part.type === 'tool-call') return `→ ${part.name}`;
      if (part.type === 'tool-result') return `← ${part.name}${part.isError ? ' (failed)' : ''}`;
      return `[${part.type}]`;
    })
    .join(' ');
}

@Component({
  selector: 'app-chat-sessions-modes',
  imports: [KritzelEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <span class="label">Chat Sessions</span>
      <button [attr.aria-pressed]="mode() === 'user'" [disabled]="mode() === 'user'" (click)="setMode('user')">
        Work as User
      </button>
      <button [attr.aria-pressed]="mode() === 'agent'" [disabled]="mode() === 'agent'" (click)="setMode('agent')">
        Work as Agent
      </button>
      <span class="label">Try “{{ slowPhrase }}” to stop a response.</span>
    </app-toolbar>
    <div class="content">
      <div class="editor-wrap">
        <kritzel-editor
          editorId="chat-sessions-modes"
          [theme]="'light'"
          [themes]="themes"
          [workspaces]="workspaces()"
          [user]="user"
          [isChatBoxVisible]="true"
          [chatSession]="isEditorReady() ? session() : null"
          [chatBoxChips]="chips()"
          [isMoreMenuVisible]="false"
          [isWorkspaceManagerVisible]="false"
          (objectsSelectionChange)="onSelectionChange($event.detail)"
          (chatChipRemove)="onChipRemove($event.detail)"
          (isReady)="isEditorReady.set(true)"
        ></kritzel-editor>
      </div>
      <ol class="chat-transcript" aria-label="Transcript">
        @for (message of messages(); track $index) {
          <li [attr.data-role]="message.role">
            <strong>{{ message.role }}:</strong> {{ describe(message) }}
          </li>
        }
      </ol>
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
      .content {
        display: flex;
        flex: 1;
        min-height: 0;
      }
      .editor-wrap {
        flex: 1;
        min-width: 0;
        position: relative;
      }
      .chat-transcript {
        width: 260px;
        margin: 0;
        padding: 8px 8px 8px 28px;
        overflow: auto;
        font-size: 13px;
        border-left: 1px solid #e5e7eb;
      }
    `,
  ],
})
export class ChatSessionsModesComponent implements OnDestroy {
  readonly slowPhrase = SLOW_PHRASE;

  readonly describe = describe;

  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new KritzelWorkspace({ objects: createSeedObjects() })]);

  user = { id: 'demo-user', name: 'Demo User' };

  // One session per mode, created once: switching the mode binds the other one.
  private readonly sessions: Record<Mode, KritzelChatSession> = (() => {
    const transport = createDemoTransport();
    const agent = new KritzelAgent({ id: 'assistant', name: 'Assistant', color: '#7C3AED' });
    return {
      user: new KritzelChatSession({ transport, system: SYSTEM }),
      agent: new KritzelChatSession({ transport, system: SYSTEM, agent }),
    };
  })();

  mode = signal<Mode>('user');

  session = computed(() => this.sessions[this.mode()]);

  chips = signal<KritzelChatBoxChip[]>([]);

  /**
   * Angular sets inputs on the editor element while it is still loading, before it watches its props, so a
   * session bound from the start would never be picked up. Bind it once the editor is ready instead.
   */
  isEditorReady = signal(false);

  messages = signal<readonly KritzelChatMessage[]>([]);

  private unsubscribe: (() => void) | null = null;

  constructor() {
    this.subscribe();
  }

  setMode(mode: Mode): void {
    if (mode === this.mode()) return;
    this.mode.set(mode);
    this.subscribe();
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
    this.chips.update(current => current.filter(item => item.id !== chip.id));
  }

  ngOnDestroy(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  private subscribe(): void {
    this.unsubscribe?.();
    const session = this.session();
    this.messages.set([...session.messages]);
    this.unsubscribe = session.on('change', () => this.messages.set([...session.messages]));
  }
}
