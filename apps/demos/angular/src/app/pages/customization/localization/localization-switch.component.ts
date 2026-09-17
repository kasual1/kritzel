import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import { KritzelEditor, EditorIsReadyEvent, LocaleCode } from '@kritzel/angular-editor';
import { createSeedObjects } from '../../../const/seed-objects';
import { ToolbarComponent } from '../../../components/toolbar.component';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';

@Component({
  selector: 'app-localization-switch',
  imports: [KritzelEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button [class.active]="activeLocale() === 'en'" (click)="setLocale('en')">English</button>
      <button [class.active]="activeLocale() === 'de'" (click)="setLocale('de')">German</button>
      <button [class.active]="activeLocale() === 'fr'" (click)="setLocale('fr')">French</button>
    </app-toolbar>
    <div class="editor-wrap">
      <kritzel-editor
        editorId="localization-switch"
        [locale]="activeLocale()"
        [theme]="'light'"
        [themes]="themes"
        [isPanningEnabled]="false"
        [isZoomingEnabled]="false"
        [isMoreMenuVisible]="true"
        [isWorkspaceManagerVisible]="true"
        (isReady)="onReady($event)"
        (localeChange)="onLocaleChange($event)"
      ></kritzel-editor>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    .editor-wrap { flex: 1; position: relative; }
    .status-bar { display: flex; align-items: center; gap: 12px; padding: 8px 12px; background: #f5f5f5; border-top: 1px solid #ebebeb; font-size: 13px; font-family: monospace; }
  `],
})
export class LocalizationSwitchComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];
  
  activeLocale = signal<LocaleCode>('en');

  async onReady(_event: CustomEvent<EditorIsReadyEvent>) {
    for (const obj of createSeedObjects()) {
      await this.editor.addObject(obj);
    }
  }

  setLocale(locale: LocaleCode) {
    this.activeLocale.set(locale);
  }

  onLocaleChange(event: CustomEvent<LocaleCode>) {
    this.activeLocale.set(event.detail);
  }
}
