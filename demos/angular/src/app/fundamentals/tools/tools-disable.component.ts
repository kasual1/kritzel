import { ChangeDetectionStrategy, Component, computed, signal, ViewChild } from '@angular/core';
import {
  KritzelBrushTool,
  KritzelEditor,
  KritzelEraserTool,
  KritzelSelectionTool,
  KritzelToolbarItem,
} from 'kritzel-angular';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { createSeedObjects } from '../../const/seed-objects';

@Component({
  selector: 'app-tools-disable',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      <button (click)="toggle()">
        {{ isEraserDisabled() ? 'Enable eraser tool' : 'Disable eraser tool' }}
      </button>
      <span class="status" [class.disabled]="isEraserDisabled()">
        {{ isEraserDisabled() ? 'Eraser tool disabled' : 'Eraser tool enabled' }}
      </span>
    </div>
    <kritzel-editor
      editorId="tools-disable"
      [theme]="'light'"
      [themes]="themes"
      [toolbarItems]="toolbarItems()"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (isReady)="onReady()"
    ></kritzel-editor>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    .toolbar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #ebebeb; }
    .toolbar button { padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 13px; }
    .toolbar button:hover { background: #dd0031; color: #fff; border-color: #dd0031; }
    .status { font-size: 13px; color: #333; }
    .status.disabled { color: #e53935; font-weight: 500; }
    kritzel-editor { flex: 1; }
  `],
})
export class ToolsDisableComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  isEraserDisabled = signal(true);

  toolbarItems = computed<KritzelToolbarItem[]>(() => {
    const isEraserDisabled = this.isEraserDisabled();

    return [
      {
        name: 'selection',
        type: 'tool',
        isDefault: true,
        tool: KritzelSelectionTool,
        icon: 'cursor',
      },
      {
        name: 'brush',
        type: 'tool',
        tool: KritzelBrushTool,
        icon: 'pen',
      },
      {
        name: 'eraser',
        type: 'tool',
        tool: KritzelEraserTool,
        icon: 'eraser',
        // Demonstrates the function form of `isDisabled` for dynamic, state-driven control.
        isDisabled: () => isEraserDisabled,
      },
      {
        name: 'config',
        type: 'config',
      },
    ];
  });

  async onReady() {
    for (const obj of createSeedObjects()) {
      await this.editor.addObject(obj);
    }
  }

  toggle() {
    this.isEraserDisabled.update(value => !value);
  }
}
