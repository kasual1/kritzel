import { Component, ChangeDetectionStrategy, ElementRef, CUSTOM_ELEMENTS_SCHEMA, signal, viewChild } from '@angular/core';
import { createSeedObjects } from '../../const/seed-objects';
import { ToolbarComponent } from '../../components/toolbar.component';

@Component({
  selector: 'app-import-export-workspace-export',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <span class="label">Workspace Export</span>
      <button (click)="previewJson()">Preview as JSON</button>
      <button (click)="downloadJson()">Download JSON</button>
    </app-toolbar>
    <div class="content">
      <div class="engine-wrap">
        <kritzel-engine #engine [isPanningEnabled]="false" [isZoomingEnabled]="false" (isEngineReady)="onReady()"></kritzel-engine>
      </div>
      <pre class="json-preview">{{ jsonPreview() }}</pre>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        font-family: Roboto, sans-serif;
      }
      .content {
        flex: 1;
        display: flex;
        min-height: 0;
      }
      .engine-wrap {
        flex: 1 1 60%;
        position: relative;
      }
      .json-preview {
        flex: 1 1 40%;
        margin: 0;
        padding: 12px;
        overflow: auto;
        font-size: 11px;
        line-height: 1.4;
        background: #1e1e1e;
        color: #d4d4d4;
        border-left: 1px solid #e0e0e0;
      }
    `,
  ],
})
export class ImportExportWorkspaceExportComponent {
  engineRef = viewChild<ElementRef<HTMLElement>>('engine');

  jsonPreview = signal('Click "Preview as JSON" to see the exported workspace.');

  private get engine(): any {
    return this.engineRef()?.nativeElement;
  }

  async onReady(): Promise<void> {
    for (const obj of createSeedObjects()) {
      await this.engine.addObject(obj);
    }
  }

  async previewJson(): Promise<void> {
    const json = await this.engine.exportAsJson();
    this.jsonPreview.set(json);
  }

  async downloadJson(): Promise<void> {
    await this.engine.downloadAsJson();
  }
}
