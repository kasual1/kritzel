import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import { KritzelEditor, EditorIsReadyEvent, KritzelSyncConfig } from 'kritzel-angular';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { createSeedObjects } from '../../const/seed-objects';

@Component({
  selector: 'app-tools-disable',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      <button (click)="toggle()">
        {{ isDisabled() ? 'Enable' : 'Disable' }}
      </button>
      <span class="status" [class.disabled]="isDisabled()">
        {{ isDisabled() ? 'Interactions disabled' : 'Interactions enabled' }}
      </span>
    </div>
    <kritzel-editor
      editorId="tools-disable"
      [theme]="'angular-theme'"
      [themes]="themes"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (isReady)="onReady($event)"
    ></kritzel-editor>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    .toolbar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #ebebeb; }
    .toolbar button { padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 13px; }
    .toolbar button:hover { background: #dd0031; color: #fff; border-color: #dd0031; }
    .status { font-size: 13px; color: #333; }
    .status.disabled { color: #e53935; font-weight: 500; }
    kritzel-editor { flex: 1; }
  `],
})
export class ToolsDisableComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  

  isDisabled = signal(true);

  async onReady(_event: CustomEvent<EditorIsReadyEvent>) {
    for (const obj of createSeedObjects()) {
      await this.editor.addObject(obj);
    }

   await this.editor.disable();
  }

  async toggle() {
    if (this.isDisabled()) {
      await this.editor.enable();
      this.isDisabled.set(false);
    } else {
      await this.editor.disable();
      this.isDisabled.set(true);
    }
  }
}
