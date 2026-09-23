import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import { KritzelEditor, KritzelWorkspace } from '@kritzel/angular-editor';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { ToolbarComponent } from '../../../components/toolbar.component';
import { createSeedObjects } from '../../../const/seed-objects';

@Component({
  selector: 'app-notifications-trigger',
  imports: [KritzelEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button type="button" (click)="notify('info')">Show info</button>
      <button type="button" (click)="notify('warning')">Show warning</button>
      <button type="button" (click)="notify('error')">Show error</button>
    </app-toolbar>
    <kritzel-editor
      #editor
      editorId="notifications-trigger"
      [theme]="'light'"
      [themes]="themes"
      [workspaces]="workspaces()"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
    ></kritzel-editor>
  `,
  styles: `
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    button { padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 13px; }
    button:hover { background: #dd0031; border-color: #dd0031; color: #fff; }
    kritzel-editor { flex: 1; }
  `,
})
export class NotificationsTriggerComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new KritzelWorkspace({ objects: createSeedObjects() })]);

  async notify(type: 'info' | 'warning' | 'error'): Promise<void> {
    await this.editor.triggerNotification({
      type,
      message: `${type[0].toUpperCase()}${type.slice(1)} notification`,
    });
  }
}