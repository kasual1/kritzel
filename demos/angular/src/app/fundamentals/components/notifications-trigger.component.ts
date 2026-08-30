import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { angularThemeLight } from '../../const/angular-theme-light';

@Component({
  selector: 'app-notifications-trigger',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      <button type="button" (click)="notify('info')">Show info</button>
      <button type="button" (click)="notify('warning')">Show warning</button>
      <button type="button" (click)="notify('error')">Show error</button>
    </div>
    <kritzel-editor
      #editor
      editorId="notifications-trigger"
      [theme]="'light'"
      [themes]="themes"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
    ></kritzel-editor>
  `,
  styles: `
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    .toolbar { display: flex; gap: 8px; padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #ebebeb; }
    button { padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 13px; }
    button:hover { background: #dd0031; border-color: #dd0031; color: #fff; }
    kritzel-editor { flex: 1; }
  `,
})
export class NotificationsTriggerComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  async notify(type: 'info' | 'warning' | 'error'): Promise<void> {
    await this.editor.triggerNotification({
      type,
      message: `${type[0].toUpperCase()}${type.slice(1)} notification`,
    });
  }
}