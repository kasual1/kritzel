import { Component, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { EditorIsReadyEvent, KritzelEditor } from 'kritzel-angular';
import { angularThemeLight } from '../const/angular-theme-light';
import { createSeedObjects } from '../const/seed-objects';

@Component({
  selector: 'app-quickstart',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      editorId="quickstart"
      [theme]="'angular-theme-light'"
      [themes]="themes"
      [wheelEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
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
export class QuickstartComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight];

  async onReady(_event: CustomEvent<EditorIsReadyEvent>) {
    for (const obj of createSeedObjects()) {
      await this.editor.addObject(obj);
    }
  }
}
