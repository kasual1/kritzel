import {
  ChangeDetectionStrategy,
  Component,
  signal,
  ViewChild,
} from '@angular/core';
import {
  KritzelEditor,
  EditorIsReadyEvent,
  KritzelBaseObject,
  KritzelSyncConfig,
} from 'kritzel-angular';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { createSeedObjects } from '../../const/seed-objects';
import {
  InfoPanelComponent,
  InfoPanelToggleComponent,
} from '../../components/info-panel.component';
import { ToolbarComponent } from '../../components/toolbar.component';

@Component({
  selector: 'app-objects-ordering',
  imports: [KritzelEditor, InfoPanelComponent, InfoPanelToggleComponent, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button (click)="selectAll()">Select All</button>
      <span class="separator"></span>
      <button (click)="bringToFront()">Bring to Front</button>
      <button (click)="bringForward()">Bring Forward</button>
      <button (click)="sendBackward()">Send Backward</button>
      <button (click)="sendToBack()">Send to Back</button>
      <app-info-panel-toggle [panel]="infoPanel"></app-info-panel-toggle>
    </app-toolbar>
    <div class="content">
      <kritzel-editor
        editorId="objects-ordering"
        [theme]="'light'"
        [themes]="themes"
        [isPanningEnabled]="false"
        [isZoomingEnabled]="false"
        [isMoreMenuVisible]="false"
        [isWorkspaceManagerVisible]="false"
        (isReady)="onReady()"
        (objectSelectionChange)="handleObjectSelectionChange()"
      ></kritzel-editor>
      <app-info-panel #infoPanel [hasToolbarToggle]="true">
        <h3>Objects</h3>
        <ul>
          @for (obj of objects(); track obj.id) {
            <li>
              <span class="type">{{ obj.__class__ }}</span>
              <span class="z">z:{{ obj.zIndex }}</span>
            </li>
          }
        </ul>
      </app-info-panel>
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
        display: flex;
        flex: 1;
        min-height: 0;
        position: relative;
      }
      kritzel-editor {
        flex: 1;
      }
      app-info-panel {
        --demo-info-panel-width: 180px;
      }
      ul {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      li {
        padding: 4px 0;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
      }
      .type {
        color: #333;
        font-weight: 500;
      }
      .z {
        color: #999;
        font-family: monospace;
        font-size: 11px;
      }
    `,
  ],
})
export class ObjectsOrderingComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  

  objects = signal<KritzelBaseObject[]>([]);

  async onReady() {
    const existing = await this.editor.getAllObjects();
    if (existing.length === 0) {
      for (const obj of createSeedObjects()) {
        await this.editor.addObject(obj);
      }

      await this.positionSeedObjectsWithOverlap();
    }

    await this.refreshObjects();
  }

  async handleObjectSelectionChange() {
    console.log('Object selection changed');
    this.refreshObjects();
  }

  async selectAll() {
    const all = await this.editor.getAllObjects();
    await this.editor.selectObjects(all);
  }

  async bringToFront() {
    await this.editor.bringToFront();
    await this.refreshObjects();
  }

  async bringForward() {
    await this.editor.bringForward();
    await this.refreshObjects();
  }

  async sendBackward() {
    await this.editor.sendBackward();
    await this.refreshObjects();
  }

  async sendToBack() {
    await this.editor.sendToBack();
    await this.refreshObjects();
  }

  private async refreshObjects() {
    const all = await this.editor.findObjects(obj => obj.__class__ !== 'KritzelSelectionBox');
    this.objects.set([...all].sort((a, b) => a.zIndex - b.zIndex));
  }

  private async positionSeedObjectsWithOverlap() {
    const all = await this.editor.getAllObjects();

    await Promise.all(
      all.map((obj) =>
        this.editor.updateObject(obj, {
          translateX: obj.translateX - obj.centerX,
          translateY: obj.translateY - obj.centerY,
        })
      )
    );
  }
}
