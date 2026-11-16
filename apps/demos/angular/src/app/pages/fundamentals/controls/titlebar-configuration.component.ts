import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import {
  UpmadeEditor,
  UpmadeObjectConfig,
  UpmadeObjectTitlebarActionEvent,
  UpmadeObjectTitlebarConfig,
  UpmadeShape,
  UpmadeWorkspace,
  ShapeType,
} from '@upmade/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { ToolbarComponent } from '../../../components/toolbar.component';

const actionLabels: Record<string, string> = {
  preview: 'Preview',
  'add-breakpoint': 'Add breakpoint',
};

// Frames keep their real pixel size and are drawn at 1/5 scale, like a zoomed-out design canvas.
const frameConfig = {
  shapeType: ShapeType.Rectangle,
  fillColor: { light: '#f5f6f7', dark: '#2b2c2f' },
  strokeColor: { light: '#f5f6f7', dark: '#2b2c2f' },
  strokeWidth: 5,
  scale: 5,
};

function createFrames() {
  return [
    new UpmadeShape({ ...frameConfig, name: 'Desktop', translateX: -268, translateY: -130, width: 1200, height: 800 }),
    new UpmadeShape({ ...frameConfig, name: 'Tablet', translateX: 4, translateY: -130, width: 768, height: 1024 }),
    new UpmadeShape({ ...frameConfig, name: 'Phone', translateX: 190, translateY: -130, width: 390, height: 844 }),
  ];
}

@Component({
  selector: 'app-titlebar-configuration',
  imports: [UpmadeEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <span class="label">Last action:</span>
      <span class="status">{{ lastAction() }}</span>
    </app-toolbar>

    <upmade-editor
      editorId="titlebar-configuration"
      [theme]="'light'"
      [themes]="themes"
      [workspaces]="workspaces()"
      [objectConfig]="objectConfig"
      [objectTitlebar]="objectTitlebar"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (objectTitlebarAction)="onTitlebarAction($event)"
    ></upmade-editor>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    upmade-editor { flex: 1; }
  `],
})
export class TitlebarConfigurationComponent {
  @ViewChild(UpmadeEditor) editor!: UpmadeEditor;

  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new UpmadeWorkspace({ objects: createFrames() })]);

  readonly objectConfig: UpmadeObjectConfig = {
    // Only named frames get a titlebar.
    hasTitlebar: object => !!object.name,
    isRotatable: false,
    isResizable: false,
  };

  // Declared once as a stable field and shared by every object accepted by `objectConfig.hasTitlebar`.
  readonly objectTitlebar: UpmadeObjectTitlebarConfig = {
    left: [
      { id: 'preview', type: 'button', icon: 'play', tooltip: 'Preview', variant: 'filled' },
      { id: 'title', type: 'title' },
      { id: 'width', type: 'text', tone: 'muted', minBarWidth: 120, text: ({ contentSize }) => `${Math.round(contentSize.width)}` },
    ],
    right: [
      { id: 'add-breakpoint', type: 'button', icon: 'plus', tooltip: 'Add breakpoint' },
    ],
  };

  lastAction = signal('Click a titlebar button');

  // The output runs inside the Angular zone, unlike `action` callbacks on the config.
  async onTitlebarAction(event: CustomEvent<UpmadeObjectTitlebarActionEvent>) {
    const { elementId, objectId, objectType } = event.detail;
    const object = await this.editor.getObjectById(objectId);
    const label = actionLabels[elementId] ?? elementId;
    this.lastAction.set(`${label} · ${object?.name ?? objectType}`);
  }
}
