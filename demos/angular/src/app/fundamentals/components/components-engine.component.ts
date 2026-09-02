import {
  Component,
  ChangeDetectionStrategy,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  viewChild,
  ViewChild,
} from '@angular/core';
import {
  KritzelBrushTool,
  KritzelEraserTool,
  KritzelSelectionTool,
  KritzelSyncConfig,
} from 'kritzel-angular';
import { createSeedObjects } from '../../const/seed-objects';
import { ToolbarComponent } from '../../components/toolbar.component';

@Component({
  selector: 'app-components-engine',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button (click)="setBrush()">Brush</button>
      <button (click)="setEraser()">Eraser</button>
      <button (click)="setSelect()">Select</button>
      <button (click)="undo()">Undo</button>
      <button (click)="redo()">Redo</button>
    </app-toolbar>
    <div class="engine-wrap">
      <kritzel-engine
        #engine
        [isPanningEnabled]="false"
        [isZoomingEnabled]="false"
        (isEngineReady)="onReady()"
      ></kritzel-engine>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      .engine-wrap {
        flex: 1;
        position: relative;
      }
    `,
  ],
})
export class ComponentsEngineComponent {
  @ViewChild('engine', { static: true }) engineRef!: ElementRef<HTMLElement>;

  

  private get engine(): any {
    return this.engineRef?.nativeElement;
  }

  async onReady() {
    // The engine does not register any tools by default — you must register them manually.
    await this.engine.registerTool('brush', KritzelBrushTool);
    await this.engine.registerTool('eraser', KritzelEraserTool);
    await this.engine.registerTool('select', KritzelSelectionTool);

    for (const obj of createSeedObjects()) {
      await this.engine.addObject(obj);
    }
    await this.engine.changeActiveTool('brush');
  }

  async setBrush() {
    await this.engine?.changeActiveTool('brush');
  }

  async setEraser() {
    await this.engine?.changeActiveTool('eraser');
  }

  async setSelect() {
    await this.engine?.changeActiveTool('select');
  }

  async undo() {
    await this.engine?.undo();
  }

  async redo() {
    await this.engine?.redo();
  }
}
