import { Component, ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor, KritzelTheme, lightTheme, darkTheme, InMemorySyncProvider, KritzelSyncConfig } from 'kritzel-angular';

@Component({
  selector: 'app-theming-apply',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      <button [class.active]="activeName === 'light'" (click)="activeName = 'light'">Light</button>
      <button [class.active]="activeName === 'dark'" (click)="activeName = 'dark'">Dark</button>
    </div>
    <div class="editor-wrap">
      <kritzel-editor
        editorId="theming-apply"
        [theme]="activeName"
        [themes]="themes"
        [wheelEnabled]="false"
        [syncConfig]="syncConfig"
        [loginConfig]="undefined"
        [isMoreMenuVisible]="false"
        [isWorkspaceManagerVisible]="false"
      ></kritzel-editor>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }
    .toolbar { display: flex; gap: 8px; padding: 8px; background: #f5f5f5; border-bottom: 1px solid #e0e0e0; }
    .toolbar button { padding: 4px 16px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; background: #fff; }
    .toolbar button.active { background: #1a73e8; color: #fff; border-color: #1a73e8; }
    .editor-wrap { flex: 1; position: relative; }
  `],
})
export class ThemingApplyComponent {
  themes: KritzelTheme[] = [lightTheme, darkTheme];
  activeName: string = 'light';

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider],
  };
}
