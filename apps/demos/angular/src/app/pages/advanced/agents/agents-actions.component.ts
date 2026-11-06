import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import {
  BroadcastSyncProvider,
  IKritzelUser,
  KritzelAgent,
  KritzelAgentActionError,
  KritzelEditor,
  KritzelObjectChangeSource,
  KritzelShape,
  KritzelSyncConfig,
  KritzelWorkspace,
  ObjectsAddedEvent,
  ObjectsRemovedEvent,
  ObjectsUpdatedEvent,
  ShapeType,
} from '@kritzel/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { ToolbarComponent } from '../../../components/toolbar.component';

const AGENT = 'agent';
const RECTANGLE_ID = 'agentic-actions-rectangle';
const ELLIPSE_ID = 'agentic-actions-ellipse';

/** Seeds with fixed IDs, so every tab of this page works on the same objects. */
function createActionSeeds(): KritzelShape[] {
  const rectangle = new KritzelShape({
    translateX: -260,
    translateY: -120,
    width: 140,
    height: 90,
    shapeType: ShapeType.Rectangle,
    fillColor: { light: '#fce4ec', dark: '#880e4f' },
    strokeColor: { light: '#c62828', dark: '#ef9a9a' },
    strokeWidth: 3,
  });
  rectangle.id = RECTANGLE_ID;
  const ellipse = new KritzelShape({
    translateX: -260,
    translateY: 80,
    width: 120,
    height: 120,
    shapeType: ShapeType.Ellipse,
    fillColor: { light: '#e3f2fd', dark: '#1a237e' },
    strokeColor: { light: '#1565c0', dark: '#90caf9' },
    strokeWidth: 3,
  });
  ellipse.id = ELLIPSE_ID;
  return [rectangle, ellipse];
}

@Component({
  selector: 'app-agents-actions',
  imports: [KritzelEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <span class="label">Agentic Actions</span>
      <button [disabled]="isRunning()" (click)="runScript()">Run Script</button>
      <button [disabled]="isRunning() || !canUndo()" (click)="history('undo')">Undo Agent</button>
      <button [disabled]="isRunning() || !canRedo()" (click)="history('redo')">Redo Agent</button>
      <button [disabled]="!isRunning()" (click)="abort()">Abort</button>
      @if (message()) {
        <span class="label">{{ message() }}</span>
      }
      @if (lastChange()) {
        <span class="status">{{ lastChange() }}</span>
      }
    </app-toolbar>
    <div class="editor-wrap">
      <kritzel-editor
        editorId="agents-actions"
        [syncConfig]="syncConfig"
        [user]="user"
        [theme]="'light'"
        [themes]="themes"
        [workspaces]="workspaces()"
        [isPanningEnabled]="false"
        [isZoomingEnabled]="false"
        [isMoreMenuVisible]="false"
        [isWorkspaceManagerVisible]="false"
        (isReady)="addAgent()"
        (objectsAdded)="onAdded($event)"
        (objectsUpdated)="onUpdated($event)"
        (objectsRemoved)="onRemoved($event)"
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
      .editor-wrap {
        flex: 1;
        position: relative;
      }
    `,
  ],
})
export class AgentsActionsComponent {
  editor = viewChild(KritzelEditor);

  themes = [angularThemeLight, angularThemeDark];

  // Awareness shares presence between the tabs: each tab sees the other tab's agent and cursor.
  syncConfig: KritzelSyncConfig = { providers: [BroadcastSyncProvider.with({ awareness: true })] };

  // One user per tab, so selections in other tabs count as collaborators.
  user: IKritzelUser = (() => {
    const id = Math.random().toString(36).slice(2, 8);
    return { id: `tab-${id}`, displayName: `Tab ${id}` };
  })();

  workspaces = signal([new KritzelWorkspace({ id: 'agentic-actions-demo', name: 'Agentic Actions', objects: createActionSeeds() })]);

  isRunning = signal(false);
  canUndo = signal(false);
  canRedo = signal(false);
  message = signal('');
  lastChange = signal('');

  private readonly agent = new KritzelAgent({ id: AGENT, name: 'Agent', color: '#7C3AED', position: { x: -400, y: -200 } });

  constructor() {
    this.agent.on('change', state => {
      this.canUndo.set(state.canUndo);
      this.canRedo.set(state.canRedo);
    });
  }

  async addAgent(): Promise<void> {
    await this.editor()?.addAgent(this.agent);
  }

  async runScript(): Promise<void> {
    const editor = this.editor();
    if (!editor || this.isRunning()) return;
    this.isRunning.set(true);
    this.message.set('');

    const agent = this.agent;
    try {
      await this.addAgent();
      // The first action that does not complete throws out of the task.
      await agent.task('Selecting', async () => {
        await agent.select([RECTANGLE_ID]);
        agent.setStatus('Moving');
        await agent.moveObject(RECTANGLE_ID, { x: 40, y: -140 }, { align: 'top-left' });
        agent.setStatus('Resizing');
        await agent.resizeObject(RECTANGLE_ID, { width: 220 });
        agent.setStatus('Rotating');
        await agent.rotateObject(RECTANGLE_ID, 10);
        agent.setStatus('Adding a note');
        const { objectIds: [note] = [] } = await agent.createShape({
          x: 60,
          y: 90,
          width: 180,
          height: 90,
          text: 'Agent note',
          style: { fillColor: '#fff8e1', strokeColor: '#f59e0b' },
        });
        if (!note) throw new Error('createShape returned no object');
        agent.setStatus('Connecting');
        await agent.connect(ELLIPSE_ID, note);
        agent.setStatus('Underlining');
        await agent.drawPath([{ x: 60, y: 200 }, { x: 120, y: 215 }, { x: 180, y: 195 }, { x: 240, y: 210 }], { style: { strokeColor: '#7C3AED' } });
        agent.setStatus('Done');
        await agent.clearSelection();
      });
      this.message.set("Script finished. Undo the agent's steps one by one, or open a second tab to watch the changes sync.");
    } catch (error) {
      if (error instanceof KritzelAgentActionError) {
        this.message.set(`${error.action.type} stopped: ${error.reason}`);
      } else {
        this.message.set(error instanceof Error ? error.message : String(error));
      }
    } finally {
      this.isRunning.set(false);
    }
  }

  async history(type: 'undo' | 'redo'): Promise<void> {
    if (!this.editor() || this.isRunning()) return;
    await this.addAgent();
    const result = await this.agent[type]();
    this.message.set(result.completed ? `Agent ${type} done.` : `Agent ${type} stopped: ${result.reason}`);
  }

  abort(): void {
    this.agent.cancel();
  }

  onAdded(event: CustomEvent<ObjectsAddedEvent>): void {
    this.onChange(event.detail.source, 'Added');
  }

  onUpdated(event: CustomEvent<ObjectsUpdatedEvent>): void {
    this.onChange(event.detail.source, 'Updated');
  }

  onRemoved(event: CustomEvent<ObjectsRemovedEvent>): void {
    this.onChange(event.detail.source, 'Removed');
  }

  private onChange(source: KritzelObjectChangeSource | undefined, kind: string): void {
    if (source) {
      this.lastChange.set(`${kind} by ${source.agentId} (${source.actionType})`);
    }
  }
}
