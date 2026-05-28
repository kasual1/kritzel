import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { KritzelEditor, KritzelViewportState, InMemorySyncProvider, KritzelSyncConfig } from 'kritzel-angular';
import { customAngularTheme } from '../../const/custom-angular-theme';

@Component({
  selector: 'app-viewport-navigation-object-focus',
  imports: [KritzelEditor, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      editorId="viewport-navigation-object-focus"
      [wheelEnabled]="false"
      [themes]="themes"
      [syncConfig]="syncConfig"
      [loginConfig]="undefined"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (viewportChange)="onViewportChange($event)"
    ></kritzel-editor>
    <div class="controls">
      <button (click)="focusSelected()">Focus Selected</button>
      <button (click)="panToOrigin()">Go to Origin</button>
      <span class="status">
        Zoom: {{ (viewport()?.scale ?? 1) * 100 | number:'1.0-0' }}%
      </span>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    kritzel-editor {
      display: block;
      flex: 1;
    }

    .controls {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #f5f5f5;
      border-top: 1px solid #ddd;
    }

    .controls button {
      padding: 6px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: #fff;
      cursor: pointer;
      font-size: 13px;
    }

    .controls button:hover {
      background: #e8e8e8;
    }

    .status {
      margin-left: auto;
      font-size: 13px;
      font-family: monospace;
    }
  `,
})
export class ViewportNavigationObjectFocusComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [customAngularTheme];

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider]
  };

  viewport = signal<KritzelViewportState | null>(null);

  async focusSelected() {
    const selected = await this.editor.getSelectedObjects();
    if (selected.length > 0) {
      await this.editor.centerObjectInViewport(selected[0]);
    }
  }

  async panToOrigin() {
    await this.editor.panTo(0, 0);
  }

  onViewportChange(event: CustomEvent<KritzelViewportState>) {
    this.viewport.set(event.detail);
  }
}
