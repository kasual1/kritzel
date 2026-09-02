import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import { KritzelEditor, EditorIsReadyEvent, LocaleCode, KritzelTheme, lightTheme } from 'kritzel-angular';
import { createSeedObjects } from '../../const/seed-objects';
import { ToolbarComponent } from '../../components/toolbar.component';

@Component({
  selector: 'app-localization-switch',
  imports: [KritzelEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <span class="label">Locale:</span>
      <button [class.active]="activeLocale() === 'en'" (click)="setLocale('en')">English (en)</button>
      <button [class.active]="activeLocale() === 'de'" (click)="setLocale('de')">German (de)</button>
      <button [class.active]="activeLocale() === 'fr'" (click)="setLocale('fr')">French (fr)</button>
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
    <div class="status-bar">
      <span>Active Locale: {{ activeLocale() }}</span>
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
