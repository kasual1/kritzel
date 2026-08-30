import { Component, ChangeDetectionStrategy, ElementRef, CUSTOM_ELEMENTS_SCHEMA, signal, viewChild } from '@angular/core';
import { createSeedObjects } from '../../const/seed-objects';

@Component({
  selector: 'app-import-export-workspace-export',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      <span class="label">Workspace Export</span>
      <button (click)="previewJson()">Preview as JSON</button>
      <button (click)="downloadJson()">Download JSON</button>
    </div>
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
      .toolbar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: #f5f5f5;
        border-bottom: 1px solid #e0e0e0;
      }
      .label {
        font-weight: 700;
        font-size: 13px;
        color: #dd0031;
        margin-right: 4px;
      }
      .toolbar button {
        padding: 6px 12px;
        border: 1px solid #ccc;
        border-radius: 4px;
        cursor: pointer;
        background: #fff;
      }
      .toolbar button:hover {
        background: #e8e8e8;
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
