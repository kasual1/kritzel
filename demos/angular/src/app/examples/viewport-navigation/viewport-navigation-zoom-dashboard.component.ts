import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { KritzelEditor, KritzelViewportState, InMemorySyncProvider, KritzelSyncConfig } from 'kritzel-angular';
import { customAngularTheme } from '../../const/custom-angular-theme';

@Component({
  selector: 'app-viewport-navigation-zoom-dashboard',
  imports: [KritzelEditor, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      editorId="viewport-navigation-zoom-dashboard"
      [wheelEnabled]="false"
      [themes]="themes"
      [syncConfig]="syncConfig"
      [loginConfig]="undefined"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (viewportChange)="onViewportChange($event)"
    ></kritzel-editor>
    <div class="status-bar">
      <span>Zoom: {{ (viewport()?.scale ?? 1) * 100 | number:'1.0-0' }}%</span>
      <span>X: {{ viewport()?.translateX ?? 0 | number:'1.0-0' }}</span>
      <span>Y: {{ viewport()?.translateY ?? 0 | number:'1.0-0' }}</span>
      <button (click)="resetZoom()">Reset Zoom</button>
      <button (click)="resetView()">Reset View</button>
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

    .status-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      background: #f5f5f5;
      border-top: 1px solid #ddd;
      font-size: 13px;
      font-family: monospace;
    }

    .status-bar button {
      padding: 4px 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: #fff;
      cursor: pointer;
    }

    .status-bar button:hover {
      background: #e8e8e8;
    }
  `,
})
export class ViewportNavigationZoomDashboardComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [customAngularTheme];

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider]
  };

  viewport = signal<KritzelViewportState | null>(null);

  async resetZoom() {
    await this.editor.zoomTo(1);
  }

  async resetView() {
    await this.editor.setViewport(0, 0, 1);
  }

  onViewportChange(event: CustomEvent<KritzelViewportState>) {
    this.viewport.set(event.detail);
  }
}
