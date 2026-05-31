import { Component, ChangeDetectionStrategy, CUSTOM_ELEMENTS_SCHEMA, ElementRef, viewChild } from '@angular/core';
import { InMemorySyncProvider, KritzelSyncConfig } from 'kritzel-angular';

@Component({
  selector: 'app-components-engine',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      <button (click)="setBrush()">Brush</button>
      <button (click)="setEraser()">Eraser</button>
      <button (click)="setSelect()">Select</button>
      <button (click)="undo()">Undo</button>
      <button (click)="redo()">Redo</button>
    </div>
    <div class="engine-wrap">
      <kritzel-engine
        #engine
        (isReady)="onReady()"
      ></kritzel-engine>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }
    .toolbar { display: flex; gap: 8px; padding: 8px; background: #f5f5f5; border-bottom: 1px solid #e0e0e0; }
    .toolbar button { padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; background: #fff; }
    .toolbar button:hover { background: #e8e8e8; }
    .engine-wrap { flex: 1; position: relative; }
  `],
})
export class ComponentsEngineComponent {
  engineRef = viewChild<ElementRef<HTMLElement>>('engine');

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider],
  };

  private get engine(): any {
    return this.engineRef()?.nativeElement;
  }

  async onReady() {
    if (!this.engine) return;
    await this.engine.initSync(this.syncConfig);
    await this.engine.changeActiveToolByName('brush');
  }

  async setBrush() {
    await this.engine?.changeActiveToolByName('brush');
  }

  async setEraser() {
    await this.engine?.changeActiveToolByName('eraser');
  }

  async setSelect() {
    await this.engine?.changeActiveToolByName('select');
  }

  async undo() {
    await this.engine?.undo();
  }

  async redo() {
    await this.engine?.redo();
  }
}
