import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import {
  UpmadeBrushTool,
  UpmadeEngine,
  UpmadeEraserTool,
  UpmadeSelectionTool,
} from '@upmade/angular-engine';

@Component({
  selector: 'upmade-canvas',
  standalone: true,
  imports: [UpmadeEngine],
  templateUrl: './upmade-canvas.component.html',
  styleUrls: ['./upmade-canvas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpmadeCanvasComponent {
  @ViewChild(UpmadeEngine, { static: true }) private engine!: UpmadeEngine;

  readonly editorId = 'upmade-canvas';
  initializationError = '';

  constructor(private readonly changeDetector: ChangeDetectorRef) {}

  async onEngineReady(): Promise<void> {
    try {
      if (!(await this.engine.registerTool('selection', UpmadeSelectionTool))) {
        throw new Error('Upmade could not register the selection tool.');
      }
      if (!(await this.engine.registerTool('brush', UpmadeBrushTool))) {
        throw new Error('Upmade could not register the brush tool.');
      }
      if (!(await this.engine.registerTool('eraser', UpmadeEraserTool))) {
        throw new Error('Upmade could not register the eraser tool.');
      }
      await this.engine.setActiveTool('brush');
    } catch (error: unknown) {
      this.initializationError = error instanceof Error ? error.message : String(error);
      this.changeDetector.markForCheck();
    }
  }
}
