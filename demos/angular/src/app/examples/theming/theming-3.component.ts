import { Component, ElementRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
import { KritzelTheme, KritzelThemeManager, lightTheme, darkTheme, ThemeName, ThemeHelper } from 'kritzel-stencil';

const brandedLightTheme: KritzelTheme = {
  ...lightTheme,
  global: {
    ...lightTheme.global,
    textPrimary: '#1a0050',
    textSecondary: '#3d1e78',
  },
  engine: {
    ...lightTheme.engine,
    backgroundColor: '#faf7ff',
  },
  controls: {
    ...lightTheme.controls,
    backgroundColor: '#ffffff',
    controlSelectedBackgroundColor: '#6200EE',
    controlSelectedColor: '#ffffff',
    controlHoverBackgroundColor: 'rgba(98, 0, 238, 0.08)',
  },
  selection: {
    ...lightTheme.selection,
    borderColor: '#6200EE',
    handleColor: '#ffffff',
  },
};

const brandedDarkTheme: KritzelTheme = {
  ...darkTheme,
  global: {
    ...darkTheme.global,
    textPrimary: '#EDE7F6',
    textSecondary: '#D1C4E9',
  },
  engine: {
    ...darkTheme.engine,
    backgroundColor: '#12005e',
  },
  controls: {
    ...darkTheme.controls,
    backgroundColor: '#1a0080',
    controlSelectedBackgroundColor: '#BB86FC',
    controlSelectedColor: '#000000',
    controlHoverBackgroundColor: 'rgba(187, 134, 252, 0.12)',
  },
  selection: {
    ...darkTheme.selection,
    borderColor: '#BB86FC',
    handleColor: '#12005e',
  },
};

@Component({
  selector: 'app-theming-3',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      #editorEl
      (isReady)="onIsReady()"
      (themeChange)="onThemeChange($event)"
    ></kritzel-editor>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `],
})
export class Theming3Component {
  @ViewChild('editorEl', { read: ElementRef }) editorEl!: ElementRef<HTMLElement>;

  onIsReady(): void {
    const stored = KritzelThemeManager.getStoredTheme();
    const theme = stored === 'dark' ? brandedDarkTheme : brandedLightTheme;
    ThemeHelper.applyThemeToElement(this.editorEl.nativeElement, theme);
  }

  onThemeChange(event: CustomEvent<ThemeName>): void {
    const theme = event.detail === 'dark' ? brandedDarkTheme : brandedLightTheme;
    ThemeHelper.applyThemeToElement(this.editorEl.nativeElement, theme);
  }
}

