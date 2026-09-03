import { ChangeDetectionStrategy, Component, computed, signal, ViewChild } from '@angular/core';
import {
  KritzelBrushTool,
  KritzelEditor,
  KritzelEraserTool,
  KritzelSelectionTool,
  KritzelToolbarItem,
} from 'kritzel-angular';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { createSeedObjects } from '../../../const/seed-objects';
import { ToolbarComponent } from '../../../components/toolbar.component';

@Component({
  selector: 'app-tools-disable',
  imports: [KritzelEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button (click)="toggle()">
        {{ isEraserDisabled() ? 'Enable eraser tool' : 'Disable eraser tool' }}
      </button>
    </app-toolbar>
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
