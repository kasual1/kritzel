import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { KritzelEditor, KritzelWorkspace } from '@kritzel/angular-editor';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { createSeedObjects } from '../../../const/seed-objects';

@Component({
  selector: 'app-zoom-panel-toggle',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="control-panel">
      <label class="checkbox-control">
        <input type="checkbox" [checked]="isZoomPanelVisible()" (change)="setZoomPanelVisible($event)" />
        <span>Zoom panel</span>
      </label>
    </div>
    <kritzel-editor
      editorId="zoom-panel-toggle"
      [theme]="'light'"
      [themes]="themes"
      [workspaces]="workspaces()"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isZoomPanelVisible]="isZoomPanelVisible()"
    ></kritzel-editor>
  `,
  styles: `
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    .control-panel { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #ebebeb; }
    .checkbox-control { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: #333; cursor: pointer; }
    kritzel-editor { flex: 1; }
  `,
})
export class ZoomPanelToggleComponent {
  isZoomPanelVisible = signal(true);

  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new KritzelWorkspace({ objects: createSeedObjects() })]);

  setZoomPanelVisible(event: Event): void {
    this.isZoomPanelVisible.set((event.target as HTMLInputElement).checked);
  }
}