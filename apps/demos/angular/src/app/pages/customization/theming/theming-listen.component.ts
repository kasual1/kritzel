import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import { KritzelEditor, KritzelTheme } from '@kritzel/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';
import {
  InfoPanelComponent,
  InfoPanelToggleComponent,
} from '../../../components/info-panel.component';
import { ToolbarComponent } from '../../../components/toolbar.component';

@Component({
  selector: 'app-theming-listen',
  imports: [KritzelEditor, InfoPanelComponent, InfoPanelToggleComponent, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button [class.active]="activeTheme() === 'light'" (click)="setTheme('light')">Light</button>
      <button [class.active]="activeTheme() === 'dark'" (click)="setTheme('dark')">Dark</button>
      <app-info-panel-toggle [panel]="infoPanel"></app-info-panel-toggle>
    </app-toolbar>

    <div class="content">
      <div class="editor-wrap">
        <kritzel-editor
          editorId="theming-listen"
          [theme]="activeTheme()"
          [themes]="themes"
          [isPanningEnabled]="false"
          [isZoomingEnabled]="false"
          [isMoreMenuVisible]="true"
          [isWorkspaceManagerVisible]="true"
          (isReady)="onReady($event)"
          (themeChange)="onThemeChange($event)"
        ></kritzel-editor>
      </div>

      <app-info-panel #infoPanel [hasToolbarToggle]="true">
        <h3>Theme changes</h3>
        <ul>
          @for (theme of themeHistory(); track $index) {
            <li>{{ theme }}</li>
          }
        </ul>
      </app-info-panel>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      font-family: Roboto, sans-serif;
    }
    .content {
      display: flex;
      flex: 1;
      min-height: 0;
      position: relative;
    }
    .editor-wrap {
      flex: 1;
      position: relative;
    }
    app-info-panel {
      --demo-info-panel-width: 220px;
    }
    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    li {
      padding: 6px 8px;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      background: #f9fafb;
      font-family: monospace;
      font-size: 12px;
    }
  `],
})
export class ThemingListenComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes: KritzelTheme[] = [angularThemeLight, angularThemeDark];

  activeTheme = signal<string>('light');
  themeHistory = signal<string[]>([]);

  async onReady(_event: CustomEvent) {
    for (const obj of createSeedObjects()) {
      await this.editor.addObject(obj);
    }

    this.applyTheme('light');
  }

  setTheme(theme: string) {
    this.applyTheme(theme);
  }

  onThemeChange(event: CustomEvent<string>) {
    this.applyTheme(event.detail);
  }

  private applyTheme(theme: string) {
    const previous = this.themeHistory();
    if (previous.at(-1) !== theme) {
      this.activeTheme.set(theme);
      this.themeHistory.update((history) => [...history, theme]);
    } else {
      this.activeTheme.set(theme);
    }
  }
}
