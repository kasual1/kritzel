import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { KritzelEditor, KritzelWorkspace, LocaleCode } from '@kritzel/angular-editor';
import { createSeedObjects } from '../../../const/seed-objects';
import {
  InfoPanelComponent,
  InfoPanelToggleComponent,
} from '../../../components/info-panel.component';
import { ToolbarComponent } from '../../../components/toolbar.component';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';

@Component({
  selector: 'app-localization-listen',
  imports: [KritzelEditor, InfoPanelComponent, InfoPanelToggleComponent, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button [class.active]="activeLocale() === 'en'" (click)="setLocale('en')">English</button>
      <button [class.active]="activeLocale() === 'de'" (click)="setLocale('de')">German</button>
      <button [class.active]="activeLocale() === 'fr'" (click)="setLocale('fr')">French</button>
      <app-info-panel-toggle [panel]="infoPanel"></app-info-panel-toggle>
    </app-toolbar>

    <div class="content">
      <div class="editor-wrap">
        <kritzel-editor
          editorId="localization-listen"
          [locale]="activeLocale()"
          [workspaces]="workspaces()"
          [theme]="'light'"
          [themes]="themes"
          [isPanningEnabled]="false"
          [isZoomingEnabled]="false"
          [isMoreMenuVisible]="true"
          [isWorkspaceManagerVisible]="true"
          (isReady)="onReady()"
          (localeChange)="onLocaleChange($event)"
        ></kritzel-editor>
      </div>

      <app-info-panel #infoPanel [hasToolbarToggle]="true">
        <h3>Locale changes</h3>
        <ul>
          @for (locale of localeHistory(); track $index) {
            <li>{{ locale }}</li>
          }
        </ul>
      </app-info-panel>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    .content {
      display: flex;
      flex: 1;
      min-height: 0;
      position: relative;
    }
    .editor-wrap { flex: 1; position: relative; }
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
export class LocalizationListenComponent {
  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new KritzelWorkspace({ objects: createSeedObjects() })]);

  activeLocale = signal<LocaleCode>('en');
  localeHistory = signal<LocaleCode[]>([]);

  onReady() {
    this.applyLocale('en');
  }

  setLocale(locale: LocaleCode) {
    this.applyLocale(locale);
  }

  onLocaleChange(event: CustomEvent<LocaleCode>) {
    this.applyLocale(event.detail);
  }

  private applyLocale(locale: LocaleCode) {
    const previous = this.localeHistory();
    if (previous.at(-1) !== locale) {
      this.activeLocale.set(locale);
      this.localeHistory.update((history) => [...history, locale]);
    } else {
      this.activeLocale.set(locale);
    }
  }
}
