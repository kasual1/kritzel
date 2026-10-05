export const angularEditorFiles = [
  {
    path: 'kritzel-canvas.component.ts',
    content: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { KritzelEditor } from '@kritzel/angular-editor';

@Component({
  selector: 'kritzel-canvas',
  standalone: true,
  imports: [KritzelEditor],
  templateUrl: './kritzel-canvas.component.html',
  styleUrls: ['./kritzel-canvas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KritzelCanvasComponent {
  readonly editorId = 'kritzel-canvas';
  isReady = false;

  onReady(): void {
    this.isReady = true;
  }
}
`,
  },
  {
    path: 'kritzel-canvas.component.html',
    content: `<kritzel-editor
  [editorId]="editorId"
  (isReady)="onReady()"
  aria-label="Kritzel canvas"
></kritzel-editor>
<p role="status">{{ isReady ? 'Kritzel is ready.' : 'Loading Kritzel…' }}</p>
`,
  },
  {
    path: 'kritzel-canvas.component.scss',
    content: `:host {
  display: block;
  width: 100%;
  height: 480px;
}

kritzel-editor {
  display: block;
  width: 100%;
  height: 100%;
}
`,
  },
];
