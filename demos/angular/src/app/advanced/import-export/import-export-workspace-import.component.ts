import { Component, ChangeDetectionStrategy, ElementRef, CUSTOM_ELEMENTS_SCHEMA, signal, viewChild } from '@angular/core';
import { createSeedObjects } from '../../const/seed-objects';

@Component({
  selector: 'app-import-export-workspace-import',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      <span class="label">Workspace Import</span>
      <span class="status">Active workspace: {{ activeWorkspaceName() }}</span>
    </div>
    <div class="content">
      <div class="engine-wrap">
        <kritzel-engine #engine [isPanningEnabled]="false" [isZoomingEnabled]="false" (isEngineReady)="onReady()"></kritzel-engine>
      </div>
      <div class="import-panel">
        <textarea class="json-input" [value]="jsonInput()" (input)="onInput($event)" spellcheck="false"></textarea>
        <button (click)="importJson()">Import Workspace</button>
      </div>
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
      .status {
        font-size: 12px;
        color: #555;
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
      .import-panel {
        flex: 1 1 40%;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px;
        border-left: 1px solid #e0e0e0;
      }
      .json-input {
        flex: 1;
        resize: none;
        font-size: 11px;
        line-height: 1.4;
        padding: 8px;
        box-sizing: border-box;
      }
      .import-panel button {
        padding: 6px 12px;
        border: 1px solid #ccc;
        border-radius: 4px;
        cursor: pointer;
        background: #fff;
        align-self: flex-start;
      }
      .import-panel button:hover {
        background: #e8e8e8;
      }
    `,
  ],
})
export class ImportExportWorkspaceImportComponent {
  engineRef = viewChild<ElementRef<HTMLElement>>('engine');

  jsonInput = signal('');
  activeWorkspaceName = signal('');

  private get engine(): any {
    return this.engineRef()?.nativeElement;
  }

  // seed a workspace and pre-fill the textarea with a valid, importable JSON sample
  async onReady(): Promise<void> {
    for (const obj of createSeedObjects()) {
      await this.engine.addObject(obj);
    }

    this.jsonInput.set(await this.engine.exportAsJson());
    this.activeWorkspaceName.set((await this.engine.getActiveWorkspace())?.name ?? '');
  }

  onInput(event: Event): void {
    this.jsonInput.set((event.target as HTMLTextAreaElement).value);
  }

  async importJson(): Promise<void> {
    await this.engine.importFromJson(this.jsonInput());
    this.activeWorkspaceName.set((await this.engine.getActiveWorkspace())?.name ?? '');
  }
}
