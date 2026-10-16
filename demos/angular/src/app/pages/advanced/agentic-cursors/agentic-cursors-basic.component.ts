import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import {
  KritzelAgenticCursorDetachedEvent,
  KritzelEditor,
  KritzelWorkspace,
} from '@kritzel/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';
import { ToolbarComponent } from '../../../components/toolbar.component';

const PLANNER = 'planner';
const WRITER = 'writer';

@Component({
  selector: 'app-agentic-cursors-basic',
  imports: [KritzelEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <span class="label">Agentic Cursors</span>
      <button [disabled]="isRunning()" (click)="runAgent()">Run Agent</button>
      <button (click)="attachToSelection()">Attach to Selection</button>
      <button (click)="addCursors()">Reset</button>
      @if (message()) {
        <span class="label">{{ message() }}</span>
      }
    </app-toolbar>
    <div class="editor-wrap">
      <kritzel-editor
        editorId="agentic-cursors-basic"
        [theme]="'light'"
        [themes]="themes"
        [workspaces]="workspaces()"
        [isPanningEnabled]="false"
        [isZoomingEnabled]="false"
        [isMoreMenuVisible]="false"
        [isWorkspaceManagerVisible]="false"
        (isReady)="addCursors()"
        (agenticCursorDetached)="onDetached($event)"
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
export class AgenticCursorsBasicComponent {
  editor = viewChild(KritzelEditor);

  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new KritzelWorkspace({ objects: createSeedObjects() })]);

  isRunning = signal(false);

  message = signal('');

  async addCursors(): Promise<void> {
    const editor = this.editor();
    if (!editor) return;

    const [rectangleId] = await this.getShapeIds();
    await editor.clearAgenticCursors();
    await editor.addAgenticCursor({
      id: PLANNER,
      name: 'Planner',
      color: '#7C3AED',
      position: rectangleId ? { objectId: rectangleId, anchor: 'top-right' } : { x: 0, y: 0 },
    });
    await editor.addAgenticCursor({
      id: WRITER,
      name: 'Writer',
      color: '#0EA5E9',
      status: 'Waiting…',
      position: { x: -220, y: 60 },
    });
  }

  async runAgent(): Promise<void> {
    const editor = this.editor();
    if (!editor || this.isRunning()) return;
    this.isRunning.set(true);
    this.message.set('');

    try {
      const [rectangleId, ellipseId] = await this.getShapeIds();
      if (!rectangleId || !ellipseId) return;
      if (!(await editor.getAgenticCursor(PLANNER))) {
        await this.addCursors();
      }

      await editor.updateAgenticCursor(PLANNER, { status: 'Thinking…' });
      await editor.updateAgenticCursor(WRITER, { status: 'Waiting…' });
      await editor.moveAgenticCursor(PLANNER, { x: -40, y: -20 });

      await editor.updateAgenticCursor(PLANNER, { status: 'Reviewing shapes' });
      await editor.updateAgenticCursor(WRITER, { status: 'Writing notes' });
      await Promise.all([
        editor.moveAgenticCursor(PLANNER, { objectId: ellipseId, anchor: 'top-left' }),
        editor.moveAgenticCursor(WRITER, { objectId: rectangleId, anchor: 'bottom-right' }, { duration: 900, easing: 'ease-out' }),
      ]);

      await editor.updateAgenticCursor(PLANNER, { status: 'Done' });
      await editor.updateAgenticCursor(WRITER, { status: null });
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
    if (!(await editor.getAgenticCursor(PLANNER))) {
      await this.addCursors();
    }
    await editor.updateAgenticCursor(PLANNER, { status: 'Following selection' });
    await editor.moveAgenticCursor(PLANNER, { objectId: selected.id, anchor: 'center' });
    this.message.set('Drag the object - the Planner cursor follows it.');
  }

  onDetached(event: CustomEvent<KritzelAgenticCursorDetachedEvent>): void {
    this.message.set(`"${event.detail.id}" detached (${event.detail.reason}).`);
  }

  private async getShapeIds(): Promise<string[]> {
    const shapes = (await this.editor()?.findObjects(obj => obj.__class__ === 'KritzelShape')) ?? [];
    return shapes.map(shape => shape.id);
  }
}
