import { Component, ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor, KritzelTheme, lightTheme, InMemorySyncProvider, KritzelSyncConfig } from 'kritzel-angular';

const brandedAccentTheme: KritzelTheme = {
  ...lightTheme,
  name: 'branded-accent',
  controls: {
    ...lightTheme.controls,
    controlSelectedBackgroundColor: '#6200EE',
    controlSelectedColor: '#ffffff',
  },
  selection: {
    ...lightTheme.selection,
    borderColor: '#6200EE',
    handleColor: '#ffffff',
  },
};

@Component({
  selector: 'app-theming-brand-accent',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      editorId="theming-brand-accent"
      theme="branded-accent"
      [themes]="themes"
      [wheelEnabled]="false"
      [syncConfig]="syncConfig"
      [loginConfig]="undefined"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
    ></kritzel-editor>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `],
})
export class ThemingBrandAccentComponent {
  themes = [brandedAccentTheme];

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider]
  };
}
