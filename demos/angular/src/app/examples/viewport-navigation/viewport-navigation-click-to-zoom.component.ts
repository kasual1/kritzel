import { ChangeDetectionStrategy, Component, ElementRef, signal, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { KritzelEditor, KritzelViewportState, InMemorySyncProvider, KritzelSyncConfig } from 'kritzel-angular';
import { customAngularTheme } from '../../const/custom-angular-theme';

@Component({
  selector: 'app-viewport-navigation-click-to-zoom',
  imports: [KritzelEditor, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      editorId="viewport-navigation-click-to-zoom"
      [wheelEnabled]="false"
      #editorEl
      [themes]="themes"
      [syncConfig]="syncConfig"
      [loginConfig]="undefined"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (viewportChange)="onViewportChange($event)"
      (click)="onCanvasClick($event)"
    ></kritzel-editor>
    <div class="status-bar">
      <span>Click canvas to zoom 2× at that point</span>
      <button (click)="resetView()">Reset View</button>
      <span class="coords">
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
      gap: 12px;
      padding: 8px 12px;
      background: #f5f5f5;
      border-top: 1px solid #ddd;
      font-size: 13px;
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

    .coords {
      margin-left: auto;
      font-family: monospace;
    }
  `,
})
export class ViewportNavigationClickToZoomComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;
  @ViewChild('editorEl', { read: ElementRef }) editorEl!: ElementRef<HTMLElement>;

  themes = [customAngularTheme];

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider]
  };

  viewport = signal<KritzelViewportState | null>(null);

  async onCanvasClick(event: MouseEvent) {
    const rect = this.editorEl.nativeElement.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    const world = await this.editor.screenToWorld(screenX, screenY);
    await this.editor.zoomTo(2, world.x, world.y);
  }

  async resetView() {
    await this.editor.setViewport(0, 0, 1);
  }

  onViewportChange(event: CustomEvent<KritzelViewportState>) {
    this.viewport.set(event.detail);
  }
}
