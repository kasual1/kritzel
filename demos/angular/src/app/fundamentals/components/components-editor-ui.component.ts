import { Component, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { KritzelEditor, KritzelSyncConfig, EditorIsReadyEvent } from 'kritzel-angular';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { createSeedObjects } from '../../const/seed-objects';

@Component({
  selector: 'app-components-editor-ui',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      editorId="components-editor-ui"
      [theme]="'light'"
      [themes]="themes"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isWorkspaceManagerVisible]="false"
      [isMoreMenuVisible]="false"
      (isReady)="onReady($event)"
    ></kritzel-editor>
  `,
  styles: [`
    :host { display: block; height: 100%; }
  `],
})
export class ComponentsEditorUiComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  async onReady(_event: CustomEvent<EditorIsReadyEvent>) {
    for (const obj of createSeedObjects()) {
      await this.editor.addObject(obj);
    }
  }
}
