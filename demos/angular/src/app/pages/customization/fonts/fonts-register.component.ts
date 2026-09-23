import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import { KritzelEditor, KritzelFontMap, KritzelTheme, KritzelText, KritzelWorkspace } from '@kritzel/angular-editor';
import { ToolbarComponent } from '../../../components/toolbar.component';
import { angularThemeLight } from '../../../const/angular-theme-light';

const customFontConfig: KritzelFontMap = {
  'pacifico': {
    family: 'Pacifico',
    label: 'Pacifico Cursive',
    cssFontFamily: "'Pacifico', cursive",
    source: 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap',
  },
};

@Component({
  selector: 'app-fonts-register',
  imports: [KritzelEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button (click)="addPacificoText()">Add Pacifico Text</button>
    </app-toolbar>
    <div class="editor-wrap">
      <kritzel-editor
        editorId="fonts-register"
        [customFonts]="fonts"
        [workspaces]="workspaces()"
        [theme]="'custom'"
        [themes]="themes"
        [isPanningEnabled]="false"
        [isZoomingEnabled]="false"
        [isMoreMenuVisible]="true"
      ></kritzel-editor>
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

  themes: KritzelTheme[] = [{
    ...angularThemeLight,
    name: 'custom',
    global: {
      fontFamily: 'Pacifico'
    }
  }];

  fonts: KritzelFontMap = customFontConfig;

  workspaces = signal([
    new KritzelWorkspace({
      id: 'fonts-register',
      name: 'Custom Fonts',
      objects: [
        new KritzelText({
          text: 'Handwritten Pacifico Font',
          translateX: -180,
          translateY: -50,
          fontSize: 24,
          fontFamily: 'Pacifico',
          fontColor: { light: '#dd0031', dark: '#ef4444' },
        } as any),
      ],
    }),
  ]);

  async addPacificoText() {
    const position = await this.randomViewportPosition();
    const textObj = new KritzelText({
      text: 'Handwritten Pacifico Font',
      translateX: position.x,
      translateY: position.y,
      fontSize: 24,
      fontFamily: 'Pacifico',
      fontColor: { light: '#dd0031', dark: '#ef4444' },
    } as any);
    await this.editor.addObject(textObj as any);
  }

  private async randomViewportPosition(): Promise<{ x: number; y: number }> {
    const viewport = await this.editor.getViewport();
    const visibleWidth = viewport.width / viewport.scale;
    const visibleHeight = viewport.height / viewport.scale;
    const visibleLeft = -viewport.translateX / viewport.scale;
    const visibleTop = -viewport.translateY / viewport.scale;

    return {
      x: visibleLeft + visibleWidth * (0.2 + Math.random() * 0.6),
      y: visibleTop + visibleHeight * (0.2 + Math.random() * 0.6),
    };
  }
}
