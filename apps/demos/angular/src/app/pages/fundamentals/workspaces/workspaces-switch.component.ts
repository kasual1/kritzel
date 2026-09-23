import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import {
  KritzelEditor,
  ActiveWorkspaceChangeEvent,
  KritzelBaseObject,
  KritzelLine,
  KritzelPath,
  KritzelShape,
  KritzelWorkspace,
  KritzelSyncConfig,
  InMemorySyncProvider,
  ShapeType,
} from '@kritzel/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { InfoPanelComponent } from '../../../components/info-panel.component';
import { ToolbarComponent } from '../../../components/toolbar.component';

interface WorkspacePalette {
  fill: string;
  stroke: string;
  accent: string;
}

function createWorkspaceObjects(palette: WorkspacePalette): KritzelBaseObject[] {
  return [
    new KritzelShape({
      translateX: -140,
      translateY: -170,
      width: 120,
      height: 120,
      shapeType: ShapeType.Ellipse,
      fillColor: { light: palette.fill, dark: palette.fill },
      strokeColor: { light: palette.stroke, dark: palette.stroke },
      strokeWidth: 3,
    }),
    new KritzelShape({
      translateX: 20,
      translateY: -150,
      width: 120,
      height: 120,
      shapeType: ShapeType.Rectangle,
      fillColor: { light: palette.fill, dark: palette.fill },
      strokeColor: { light: palette.accent, dark: palette.accent },
      strokeWidth: 3,
    }),
    new KritzelLine({
      startX: -170,
      startY: 10,
      endX: 130,
      endY: 10,
      stroke: { light: palette.accent, dark: palette.accent },
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
      fill: { light: palette.stroke, dark: palette.stroke },
    }),
  ];
}

@Component({
  selector: 'app-workspaces-switch',
  imports: [KritzelEditor, InfoPanelComponent, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      @for (ws of workspaces(); track ws.id) {
        <button
          [class.active]="ws.id === activeWorkspaceId()"
          (click)="switchTo(ws)"
        >
          {{ ws.name }}
        </button>
      }
    </app-toolbar>
    <div class="content">
      <kritzel-editor
        editorId="workspaces-switch"
        [theme]="'light'"
        [themes]="themes"
        [syncConfig]="syncConfig"
        [workspaces]="workspaces()"
        [activeWorkspaceId]="activeWorkspaceId()"
        [isPanningEnabled]="false"
        [isZoomingEnabled]="false"
        [isMoreMenuVisible]="false"
        [isWorkspaceManagerVisible]="false"
        (activeWorkspaceChange)="onActiveWorkspaceChange($event)"
      ></kritzel-editor>
      <app-info-panel>
        <h3>Active Workspace</h3>
        <pre>{{ activeWorkspaceJson() }}</pre>
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
        display: flex;
        flex: 1;
        min-height: 0;
        position: relative;
      }
      kritzel-editor {
        flex: 1;
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
export class WorkspacesSwitchComponent {
  themes = [angularThemeLight, angularThemeDark];

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider],
  };

  workspaces = signal<KritzelWorkspace[]>([
    new KritzelWorkspace({ id: 'coral', name: 'Coral', objects: createWorkspaceObjects({ fill: '#fce4ec', stroke: '#c62828', accent: '#ff9800' }) }),
    new KritzelWorkspace({ id: 'ocean', name: 'Ocean', objects: createWorkspaceObjects({ fill: '#e3f2fd', stroke: '#1565c0', accent: '#00bcd4' }) }),
    new KritzelWorkspace({ id: 'violet', name: 'Violet', objects: createWorkspaceObjects({ fill: '#f3e5f5', stroke: '#6a1b9a', accent: '#e91e63' }) }),
    new KritzelWorkspace({ id: 'meadow', name: 'Meadow', objects: createWorkspaceObjects({ fill: '#e8f5e9', stroke: '#2e7d32', accent: '#8bc34a' }) }),
    new KritzelWorkspace({ id: 'amber', name: 'Amber', objects: createWorkspaceObjects({ fill: '#fff3e0', stroke: '#ef6c00', accent: '#795548' }) }),
    new KritzelWorkspace({ id: 'lagoon', name: 'Lagoon', objects: createWorkspaceObjects({ fill: '#e0f7fa', stroke: '#00838f', accent: '#3f51b5' }) }),
  ]);
  activeWorkspaceId = signal<string | undefined>('coral');
  activeWorkspace = computed(
    () => this.workspaces().find((workspace) => workspace.id === this.activeWorkspaceId()) ?? null,
  );
  activeWorkspaceJson = computed(() => {
    const workspace = this.activeWorkspace();
    if (!workspace) {
      return '';
    }

    return JSON.stringify(
      {
        ...workspace.serialize(),
        objects: workspace.objects?.map((object) => object.serialize()) ?? [],
      },
      null,
      2,
    );
  });

  onActiveWorkspaceChange(event: CustomEvent<ActiveWorkspaceChangeEvent>) {
    this.activeWorkspaceId.set(event.detail.id);
  }

  switchTo(workspace: KritzelWorkspace) {
    this.activeWorkspaceId.set(workspace.id);
  }
}
