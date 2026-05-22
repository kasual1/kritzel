import { ChangeDetectionStrategy, Component } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';

@Component({
  selector: 'app-multi-editor-page',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="multi-editor-host">
      <div class="editor-container editor-container-first">
        <kritzel-editor id="editor-1" editorId="e2e-editor-1" class="editor"></kritzel-editor>
      </div>

      <div class="editor-container editor-container-second">
        <kritzel-editor id="editor-2" editorId="e2e-editor-2" class="editor"></kritzel-editor>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100vh;
      }

      .multi-editor-host {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        padding: 24px;
        box-sizing: border-box;
        height: 100%;
        background: linear-gradient(135deg, #f7f8fb, #fef6f7);
      }

      .editor-container {
        position: relative;
        overflow: hidden;
        border-radius: 12px;
        background: #ffffff;
      }

      .editor-container-first {
        border: 2px solid #3f7ac8;
      }

      .editor-container-second {
        border: 2px solid #d65067;
      }

      .editor {
        width: 100%;
        height: 100%;
        display: block;
      }
    `,
  ],
})
export class MultiEditorPageComponent {}
