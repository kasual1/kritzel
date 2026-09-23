import { Component, ChangeDetectionStrategy, signal, viewChild } from '@angular/core';
import { EditorIsReadyEvent, KritzelBaseObject, KritzelEditor, KritzelLine, KritzelPath, KritzelShape, KritzelWorkspace, ShapeType } from '@kritzel/angular-editor';
import { InfoPanelComponent } from '../../../components/info-panel.component';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { createSeedObjects } from '../../../const/seed-objects';
import { ToolbarComponent } from '../../../components/toolbar.component';

function createImportedWorkspaceObjects(): KritzelBaseObject[] {
  return [
    new KritzelShape({
      translateX: -140,
      translateY: -170,
      width: 120,
      height: 120,
      shapeType: ShapeType.Ellipse,
      fillColor: { light: '#e3f2fd', dark: '#e3f2fd' },
      strokeColor: { light: '#1565c0', dark: '#1565c0' },
      strokeWidth: 3,
    }),
    new KritzelShape({
      translateX: 20,
      translateY: -150,
      width: 120,
      height: 120,
      shapeType: ShapeType.Rectangle,
      fillColor: { light: '#e3f2fd', dark: '#e3f2fd' },
      strokeColor: { light: '#00bcd4', dark: '#00bcd4' },
      strokeWidth: 3,
    }),
    new KritzelLine({
      startX: -170,
      startY: 10,
      endX: 130,
      endY: 10,
      stroke: { light: '#00bcd4', dark: '#00bcd4' },
      strokeWidth: 3,
    }),
    new KritzelPath({
      points: [
        [0, 0, 0.5],
        [30, -40, 0.5],
        [60, -10, 0.5],
        [90, -50, 0.5],
        [120, -20, 0.5],
        [150, -60, 0.5],
        [180, -30, 0.5],
        [210, -70, 0.5],
        [240, -40, 0.5],
      ],
      translateX: -125,
      translateY: 125,
      strokeWidth: 8,
      fill: { light: '#1565c0', dark: '#1565c0' },
    }),
  ];
}

function createImportedWorkspaceJson(): string {
  const workspace = new KritzelWorkspace({
    name: 'Imported Workspace',
    objects: createImportedWorkspaceObjects(),
  });

  return JSON.stringify(
    {
      ...workspace.serialize(),
      objects: workspace.objects?.map((object) => object.serialize()) ?? [],
    },
    null,
    2,
  );
}

@Component({
  selector: 'app-import-export-workspace-import',
  imports: [InfoPanelComponent, KritzelEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button (click)="importJson()">Import Workspace</button>
      <span class="status">Active workspace: {{ activeWorkspaceName() }}</span>
    </app-toolbar>
    <div class="content">
      <div class="editor-wrap">
        <kritzel-editor
          editorId="import-export-workspace-import"
          [theme]="'light'"
          [themes]="themes"
          [workspaces]="workspaces()"
          [isPanningEnabled]="false"
          [isZoomingEnabled]="false"
          [isMoreMenuVisible]="false"
          [isWorkspaceManagerVisible]="false"
          (isReady)="onReady($event)"
        ></kritzel-editor>
      </div>
      <app-info-panel>
        <h3>Workspace to Import</h3>
        <pre>{{ jsonInput() }}</pre>
      </app-info-panel>
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
        flex: 1;
        display: flex;
        min-height: 0;
      }
      .editor-wrap {
        flex: 1 1 60%;
        position: relative;
      }
      kritzel-editor {
        display: block;
        height: 100%;
      }
      app-info-panel {
        --demo-info-panel-width: 300px;
      }
      pre {
        margin: 0;
        overflow-wrap: anywhere;
        white-space: pre-wrap;
        font-family: monospace;
        font-size: 11px;
        line-height: 1.45;
      }
    `,
  ],
})
export class ImportExportWorkspaceImportComponent {
  editor = viewChild(KritzelEditor);

  jsonInput = signal('');
  activeWorkspaceName = signal('');
  themes = [angularThemeLight, angularThemeDark];
  workspaces = signal<KritzelWorkspace[]>([
    new KritzelWorkspace({
      id: 'workspace-import-initial',
      name: 'Initial Workspace',
      objects: createSeedObjects(),
    }),
  ]);

  async onReady(_event: CustomEvent<EditorIsReadyEvent>): Promise<void> {
    this.jsonInput.set(createImportedWorkspaceJson());
    this.activeWorkspaceName.set((await this.editor()?.getActiveWorkspace())?.name ?? '');
  }

  async importJson(): Promise<void> {
    await this.editor()?.importFromJson(this.jsonInput());
    const activeWorkspace = await this.editor()?.getActiveWorkspace();
    if (!activeWorkspace) return;

    this.workspaces.update((workspaces) => [...workspaces, activeWorkspace]);
    this.activeWorkspaceName.set(activeWorkspace.name);
  }
}
