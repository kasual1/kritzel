import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import {
  UpdrawBrushTool,
  UpdrawEngine,
  UpdrawEraserTool,
  UpdrawSelectionTool,
} from '@updraw/angular-engine';

@Component({
  selector: 'updraw-canvas',
  standalone: true,
  imports: [UpdrawEngine],
  templateUrl: './updraw-canvas.component.html',
  styleUrls: ['./updraw-canvas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdrawCanvasComponent {
  @ViewChild(UpdrawEngine, { static: true }) private engine!: UpdrawEngine;

  readonly editorId = 'updraw-canvas';
  initializationError = '';

  constructor(private readonly changeDetector: ChangeDetectorRef) {}

  async onEngineReady(): Promise<void> {
    try {
      if (!(await this.engine.registerTool('selection', UpdrawSelectionTool))) {
        throw new Error('Updraw could not register the selection tool.');
      }
      if (!(await this.engine.registerTool('brush', UpdrawBrushTool))) {
        throw new Error('Updraw could not register the brush tool.');
      }
      if (!(await this.engine.registerTool('eraser', UpdrawEraserTool))) {
        throw new Error('Updraw could not register the eraser tool.');
      }
      await this.engine.setActiveTool('brush');
    } catch (error: unknown) {
      this.initializationError = error instanceof Error ? error.message : String(error);
      this.changeDetector.markForCheck();
    }
  }
}
