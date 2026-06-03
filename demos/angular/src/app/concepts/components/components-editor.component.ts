import { Component, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import {
  KritzelEditor,
  InMemorySyncProvider,
  KritzelSyncConfig,
  EditorIsReadyEvent,
} from 'kritzel-angular';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { createSeedObjects } from '../../const/seed-objects';

@Component({
  selector: 'app-components-editor',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      editorId="components-editor"
      [wheelEnabled]="false"
      [theme]="'angular-theme'"
      [themes]="themes"
      [syncConfig]="syncConfig"
      [loginConfig]="undefined"
      (isReady)="onReady($event)"
    ></kritzel-editor>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class ComponentsEditorComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider],
  };

  async onReady(_event: CustomEvent<EditorIsReadyEvent>) {
    for (const obj of createSeedObjects()) {
      await this.editor.addObject(obj);
    }
  }
}
