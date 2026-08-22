import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import { KritzelEditor, EditorIsReadyEvent, LocaleCode, KritzelTheme, lightTheme } from 'kritzel-angular';
import { createSeedObjects } from '../../const/seed-objects';

@Component({
  selector: 'app-localization-switch',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      <span class="label">Locale:</span>
      <button [class.active]="activeLocale() === 'en'" (click)="setLocale('en')">English (en)</button>
      <button [class.active]="activeLocale() === 'de'" (click)="setLocale('de')">German (de)</button>
      <button [class.active]="activeLocale() === 'fr'" (click)="setLocale('fr')">French (fr)</button>
    </div>
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
    <div class="status-bar">
      <span>Active Locale: {{ activeLocale() }}</span>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    .toolbar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #ebebeb; }
    .toolbar .label { font-weight: 500; font-size: 13px; margin-right: 4px; }
    .toolbar button { padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 13px; }
    .toolbar button:hover { background: #dd0031; color: #fff; border-color: #dd0031; }
    .toolbar button.active { background: #dd0031; color: #fff; border-color: #dd0031; }
    .editor-wrap { flex: 1; position: relative; }
    .status-bar { display: flex; align-items: center; gap: 12px; padding: 8px 12px; background: #f5f5f5; border-top: 1px solid #ebebeb; font-size: 13px; font-family: monospace; }
  `],
})
export class LocalizationSwitchComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes: KritzelTheme[] = [lightTheme];
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
