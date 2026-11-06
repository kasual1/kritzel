import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import {
  BroadcastSyncProvider,
  IKritzelUser,
  KritzelAgenticAction,
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
  selector: 'app-agentic-cursors-actions',
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
        editorId="agentic-cursors-actions"
        [syncConfig]="syncConfig"
        [user]="user"
        [theme]="'light'"
        [themes]="themes"
        [workspaces]="workspaces()"
        [isPanningEnabled]="false"
        [isZoomingEnabled]="false"
        [isMoreMenuVisible]="false"
        [isWorkspaceManagerVisible]="false"
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
export class AgenticCursorsActionsComponent {
  editor = viewChild(KritzelEditor);

  themes = [angularThemeLight, angularThemeDark];

  syncConfig: KritzelSyncConfig = { providers: [BroadcastSyncProvider] };

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

  private abortController: AbortController | null = null;

  async runScript(): Promise<void> {
    const editor = this.editor();
    if (!editor || this.isRunning()) return;
    this.isRunning.set(true);
    this.message.set('');
    this.abortController = new AbortController();

    try {
      await this.ensureAgent();
      await this.perform({ type: 'select', objectIds: [RECTANGLE_ID] }, 'Selecting');
      await this.perform({ type: 'moveObject', objectId: RECTANGLE_ID, to: { x: 40, y: -140 }, align: 'top-left' }, 'Moving');
      await this.perform({ type: 'resizeObject', objectId: RECTANGLE_ID, width: 220 }, 'Resizing');
      await this.perform({ type: 'rotateObject', objectId: RECTANGLE_ID, angle: 10 }, 'Rotating');
      const [note] = await this.perform(
        { type: 'createShape', x: 60, y: 90, width: 180, height: 90, text: 'Agent note', style: { fillColor: '#fff8e1', strokeColor: '#f59e0b' } },
        'Adding a note',
      );
      if (!note) throw new Error('createShape returned no object');
      await this.perform({ type: 'connect', from: ELLIPSE_ID, to: note }, 'Connecting');
      await this.perform(
        { type: 'drawPath', points: [{ x: 60, y: 200 }, { x: 120, y: 215 }, { x: 180, y: 195 }, { x: 240, y: 210 }], style: { color: '#7C3AED' } },
        'Underlining',
      );
      await this.perform({ type: 'clearSelection' }, 'Done');
      this.message.set("Script finished. Undo the agent's steps one by one, or open a second tab to watch the changes sync.");
    } catch (error) {
      this.message.set(error instanceof Error ? error.message : String(error));
    } finally {
      await editor.updateAgenticCursor(AGENT, { status: null }).catch(() => undefined);
      this.abortController = null;
      this.isRunning.set(false);
      await this.refreshHistory();
    }
  }

  async history(type: 'undo' | 'redo'): Promise<void> {
    const editor = this.editor();
    if (!editor || this.isRunning()) return;
    await this.ensureAgent();
    const result = await editor.performAgenticAction(AGENT, { type });
    this.message.set(result.completed ? `Agent ${type} done.` : `Agent ${type} stopped: ${result.reason}`);
    await this.refreshHistory();
  }

  abort(): void {
    this.abortController?.abort();
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

  private async ensureAgent(): Promise<void> {
    const editor = this.editor();
    if (editor && !(await editor.getAgenticCursor(AGENT))) {
      await editor.addAgenticCursor({ id: AGENT, name: 'Agent', color: '#7C3AED', position: { x: -400, y: -200 } });
    }
  }

  private async perform(action: KritzelAgenticAction, status: string): Promise<string[]> {
    const editor = this.editor()!;
    await editor.updateAgenticCursor(AGENT, { status });
    const result = await editor.performAgenticAction(AGENT, action, { signal: this.abortController?.signal });
    if (!result.completed) {
      throw new Error(`${action.type} stopped: ${result.reason}`);
    }
    return result.objectIds ?? [];
  }

  private async refreshHistory(): Promise<void> {
    const cursor = await this.editor()?.getAgenticCursor(AGENT);
    this.canUndo.set(!!cursor?.canUndo);
    this.canRedo.set(!!cursor?.canRedo);
  }
}
