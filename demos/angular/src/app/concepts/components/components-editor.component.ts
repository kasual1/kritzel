import { Component, ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor, InMemorySyncProvider, KritzelSyncConfig } from 'kritzel-angular';
import { customAngularTheme } from '../../const/custom-angular-theme';

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
    ></kritzel-editor>
  `,
  styles: [`
    :host { display: block; height: 100%; }
  `],
})
export class ComponentsEditorComponent {
  themes = [customAngularTheme];

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider],
  };
}
