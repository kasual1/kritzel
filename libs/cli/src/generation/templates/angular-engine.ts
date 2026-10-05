export const angularEngineFiles = [
  {
    path: 'kritzel-canvas.component.ts',
    content: `import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import {
  KritzelBrushTool,
  KritzelEngine,
  KritzelEraserTool,
  KritzelSelectionTool,
} from '@kritzel/angular-engine';

@Component({
  selector: 'kritzel-canvas',
  standalone: true,
  imports: [KritzelEngine],
  templateUrl: './kritzel-canvas.component.html',
  styleUrls: ['./kritzel-canvas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KritzelCanvasComponent {
  @ViewChild(KritzelEngine, { static: true }) private engine!: KritzelEngine;

  readonly editorId = 'kritzel-canvas';
  initializationError = '';

  constructor(private readonly changeDetector: ChangeDetectorRef) {}

  async onEngineReady(): Promise<void> {
    try {
      if (!(await this.engine.registerTool('selection', KritzelSelectionTool))) {
        throw new Error('Kritzel could not register the selection tool.');
      }
      if (!(await this.engine.registerTool('brush', KritzelBrushTool))) {
        throw new Error('Kritzel could not register the brush tool.');
      }
      if (!(await this.engine.registerTool('eraser', KritzelEraserTool))) {
        throw new Error('Kritzel could not register the eraser tool.');
      }
      await this.engine.setActiveTool('brush');
    } catch (error: unknown) {
      this.initializationError = error instanceof Error ? error.message : String(error);
      this.changeDetector.markForCheck();
    }
  }
}
`,
  },
  {
    path: 'kritzel-canvas.component.html',
    content: `<kritzel-engine
  [editorId]="editorId"
  (isEngineReady)="onEngineReady()"
  aria-label="Kritzel canvas"
></kritzel-engine>
@if (initializationError) {
  <p role="alert">{{ initializationError }}</p>
}
`,
  },
  {
    path: 'kritzel-canvas.component.scss',
    content: `:host {
  display: block;
  width: 100%;
  height: 480px;
}

kritzel-engine {
  display: block;
  width: 100%;
  height: 100%;
}
`,
  },
];
