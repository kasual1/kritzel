import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { KritzelEditor, KritzelViewportState, InMemorySyncProvider, KritzelSyncConfig } from 'kritzel-angular';
import { customAngularTheme } from '../../const/custom-angular-theme';

@Component({
  selector: 'app-viewport-navigation-bounded-canvas',
  imports: [KritzelEditor, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      editorId="viewport-navigation-bounded-canvas"
      [wheelEnabled]="false"
      [themes]="themes"
      [syncConfig]="syncConfig"
      [viewportBoundaryLeft]="-2000"
      [viewportBoundaryRight]="2000"
      [viewportBoundaryTop]="-2000"
      [viewportBoundaryBottom]="2000"
      [loginConfig]="undefined"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (viewportChange)="onViewportChange($event)"
    ></kritzel-editor>
    <div class="status-bar">
      <span class="label">Bounded Canvas (±2000)</span>
      <span>
        Zoom: {{ (viewport()?.scale ?? 1) * 100 | number:'1.0-0' }}%
        &nbsp;|&nbsp;
        X: {{ viewport()?.translateX ?? 0 | number:'1.0-0' }}
        Y: {{ viewport()?.translateY ?? 0 | number:'1.0-0' }}
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

    .status-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: #f5f5f5;
      border-top: 1px solid #ddd;
      font-size: 13px;
      font-family: monospace;
    }

    .label {
      font-weight: 600;
      font-family: sans-serif;
    }
  `,
})
export class ViewportNavigationBoundedCanvasComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [customAngularTheme];

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider]
  };

  viewport = signal<KritzelViewportState | null>(null);

  onViewportChange(event: CustomEvent<KritzelViewportState>) {
    this.viewport.set(event.detail);
  }
}
