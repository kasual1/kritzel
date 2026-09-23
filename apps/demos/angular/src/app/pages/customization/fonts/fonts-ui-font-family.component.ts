import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { KritzelEditor, KritzelFontMap, KritzelTheme } from '@kritzel/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';

const customFonts: KritzelFontMap = {
  pacifico: {
    family: 'Pacifico',
    label: 'Pacifico Cursive',
    cssFontFamily: "'Pacifico', cursive",
    source: 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap',
  },
};

@Component({
  selector: 'app-fonts-ui-font-family',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="editor-wrap">
      <kritzel-editor
        editorId="fonts-ui-font-family"
        [customFonts]="fonts"
        [theme]="'light'"
        [themes]="themes"
        [isPanningEnabled]="false"
        [isZoomingEnabled]="false"
        [isMoreMenuVisible]="true"
        (isReady)="onReady()"
      ></kritzel-editor>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    .editor-wrap { flex: 1; position: relative; }
  `],
})
export class FontsUiFontFamilyComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  fonts = customFonts;

  themes: KritzelTheme[] = [{
    ...angularThemeLight,
    global: {
      ...angularThemeLight.global,
      fontFamily: "'Pacifico', cursive",
    },
  }];

  onReady() {
    this.editor.openSettingsDialog();
  }
}
