import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import {
  UpdrawAgent,
  UpdrawAgentOptions,
  UpdrawEditor,
  UpdrawWorkspace,
} from '@updraw/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';
import { ToolbarComponent } from '../../../components/toolbar.component';

const PLANNER = 'planner';
const WRITER = 'writer';

@Component({
  selector: 'app-agents-basic',
  imports: [UpdrawEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <span class="label">Agentic Cursors</span>
      <button [disabled]="isRunning()" (click)="runAgent()">Run Agent</button>
      <button (click)="attachToSelection()">Attach to Selection</button>
      <button (click)="addAgents()">Reset</button>
      @if (message()) {
        <span class="label">{{ message() }}</span>
      }
    </app-toolbar>
    <div class="editor-wrap">
      <updraw-editor
        editorId="agents-basic"
        [theme]="'light'"
        [themes]="themes"
        [workspaces]="workspaces()"
        [isPanningEnabled]="false"
        [isZoomingEnabled]="false"
        [isMoreMenuVisible]="false"
        [isWorkspaceManagerVisible]="false"
        (isReady)="addAgents()"
      ></updraw-editor>
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
export class AgentsBasicComponent {
  editor = viewChild(UpdrawEditor);

  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new UpdrawWorkspace({ objects: createSeedObjects() })]);

  isRunning = signal(false);

  message = signal('');

  private planner: UpdrawAgent | null = null;

  private writer: UpdrawAgent | null = null;

  async addAgents(): Promise<void> {
    const editor = this.editor();
    if (!editor) return;

    const [rectangleId] = await this.getShapeIds();
    for (const agent of await editor.getAgents()) {
      await editor.removeAgent(agent);
    }
    this.planner = this.createAgent({
      id: PLANNER,
      name: 'Planner',
      color: '#7C3AED',
      position: rectangleId ? { objectId: rectangleId, anchor: 'top-right' } : { x: 0, y: 0 },
    });
    this.writer = this.createAgent({
      id: WRITER,
      name: 'Writer',
      color: '#0EA5E9',
      status: 'Waiting…',
      position: { x: -220, y: 60 },
    });
    await editor.addAgent(this.planner);
    await editor.addAgent(this.writer);
  }

  async runAgent(): Promise<void> {
    const editor = this.editor();
    if (!editor || this.isRunning()) return;
    this.isRunning.set(true);
    this.message.set('');

    try {
      const [rectangleId, ellipseId] = await this.getShapeIds();
      if (!rectangleId || !ellipseId) return;
      const { planner, writer } = await this.ensureAgents();

      planner.setStatus('Thinking…');
      writer.setStatus('Waiting…');
      await planner.moveTo({ x: -40, y: -20 });

      planner.setStatus('Reviewing shapes');
      writer.setStatus('Writing notes');
      await Promise.all([
        planner.moveTo({ objectId: ellipseId, anchor: 'top-left' }),
        writer.moveTo({ objectId: rectangleId, anchor: 'bottom-right' }, { duration: 900, easing: 'ease-out' }),
      ]);

      planner.setStatus('Done');
      writer.setStatus(null);
    } finally {
      this.isRunning.set(false);
    }
  }

  async attachToSelection(): Promise<void> {
    const editor = this.editor();
    if (!editor) return;
    const [selected] = await editor.getSelectedObjects();
    if (!selected) {
      this.message.set('Select an object first.');
      return;
    }
    const { planner } = await this.ensureAgents();
    planner.setStatus('Following selection');
    await planner.moveTo({ objectId: selected.id, anchor: 'center' });
    this.message.set('Drag the object - the Planner cursor follows it.');
  }

  private createAgent(options: UpdrawAgentOptions): UpdrawAgent {
    const agent = new UpdrawAgent(options);
    agent.on('detached', ({ reason }) => this.message.set(`"${agent.id}" detached (${reason}).`));
    return agent;
  }

  private async ensureAgents(): Promise<{ planner: UpdrawAgent; writer: UpdrawAgent }> {
    if (!this.planner?.isAdded || !this.writer?.isAdded) {
      await this.addAgents();
    }
    return { planner: this.planner!, writer: this.writer! };
  }

  private async getShapeIds(): Promise<string[]> {
    const shapes = (await this.editor()?.findObjects(obj => obj.__class__ === 'UpdrawShape')) ?? [];
    return shapes.map(shape => shape.id);
  }
}
