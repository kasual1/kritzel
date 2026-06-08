import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';

import {
  EditorIsReadyEvent,
  KritzelEditor,
  KritzelImage,
} from 'kritzel-angular';
import { angularThemeLight } from '../const/angular-theme-light';
import { angularThemeDark } from '../const/angular-theme-dark';

@Component({
  selector: 'app-editor-page',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<kritzel-editor
    [theme]="'angular-theme'"
    [themes]="themes"
    (isReady)="onReady($event)"
  ></kritzel-editor>`,
})
export class EditorPageComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  async onReady(_event: CustomEvent<EditorIsReadyEvent>) {
    const bg = new KritzelImage({
      src: 'http://localhost:4200/assets/floorplan.png',
      maxWidth: 1200,
      maxHeight: 900,
      translateX: -600,
      translateY: -450,
    });

    await this.editor.addObject(bg);

    await this.editor.centerObjects([bg]);
  }
}
