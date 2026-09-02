import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import { KritzelEditor, EditorIsReadyEvent, KritzelFontMap, KritzelTheme, KritzelText, lightTheme } from 'kritzel-angular';
import { ToolbarComponent } from '../../components/toolbar.component';

const customFontConfig: KritzelFontMap = {
  'pacifico': {
    family: 'Pacifico',
    label: 'Pacifico Cursive',
    cssFontFamily: "'Pacifico', cursive",
    source: 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap',
  },
  'fira-code': {
    family: 'Fira Code',
    label: 'Fira Code Monospace',
    cssFontFamily: "'Fira Code', monospace",
    source: 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;700&display=swap',
  },
  'space-grotesk': {
    family: 'Space Grotesk',
    label: 'Space Grotesk Sans',
    cssFontFamily: "'Space Grotesk', sans-serif",
    source: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&display=swap',
  },
};

@Component({
  selector: 'app-fonts-register',
  imports: [KritzelEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <span class="label">Custom Fonts Demo:</span>
      <button (click)="addPacificoText()">Add Pacifico Text</button>
      <button (click)="addFiraCodeText()">Add Fira Code Text</button>
      <button (click)="addSpaceGroteskText()">Add Space Grotesk Text</button>
    </app-toolbar>
    <div class="editor-wrap">
      <kritzel-editor
        editorId="fonts-register"
        [customFonts]="fonts"
        [theme]="'light'"
        [themes]="themes"
        [isPanningEnabled]="false"
        [isZoomingEnabled]="false"
        [isMoreMenuVisible]="true"
        (isReady)="onReady($event)"
      ></kritzel-editor>
    </div>
    <div class="status-bar">
      <span>Registered Fonts: Pacifico, Fira Code, Space Grotesk</span>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    .editor-wrap { flex: 1; position: relative; }
    .status-bar { display: flex; align-items: center; gap: 12px; padding: 8px 12px; background: #f5f5f5; border-top: 1px solid #ebebeb; font-size: 13px; font-family: monospace; }
  `],
})
export class FontsRegisterComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes: KritzelTheme[] = [lightTheme];
  fonts: KritzelFontMap = customFontConfig;

  async onReady(_event: CustomEvent<EditorIsReadyEvent>) {
    await this.addPacificoText();
    await this.addFiraCodeText();
    await this.addSpaceGroteskText();
  }

  async addPacificoText() {
    const textObj = new KritzelText({
      text: 'Handwritten Pacifico Font',
      translateX: 100,
      translateY: 100,
      fontSize: 32,
      fontFamily: 'Pacifico',
      fontColor: { light: '#dd0031', dark: '#ef4444' },
    } as any);
    await this.editor.addObject(textObj as any);
  }

  async addFiraCodeText() {
    const textObj = new KritzelText({
      text: 'const code = "Fira Code Monospace";',
      translateX: 100,
      translateY: 180,
      fontSize: 24,
      fontFamily: 'Fira Code',
      fontColor: { light: '#1e293b', dark: '#cbd5e1' },
    } as any);
    await this.editor.addObject(textObj as any);
  }

  async addSpaceGroteskText() {
    const textObj = new KritzelText({
      text: 'Modern Space Grotesk Typography',
      translateX: 100,
      translateY: 250,
      fontSize: 28,
      fontFamily: 'Space Grotesk',
      fontColor: { light: '#0f766e', dark: '#2dd4bf' },
    } as any);
    await this.editor.addObject(textObj as any);
  }
}
