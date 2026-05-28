import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import {
  KritzelEditor,
  EditorIsReadyEvent,
  InMemorySyncProvider,
  KritzelBaseObject,
  KritzelSyncConfig,
  KritzelShape,
  KritzelPath,
  KritzelLine,
  ShapeType,
  ObjectsAddedEvent,
  ObjectsRemovedEvent,
  ObjectsUpdatedEvent,
} from 'kritzel-angular';
import { customAngularTheme } from '../../const/custom-angular-theme';

@Component({
  selector: 'app-object-management-interactive-layer-panel',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      [theme]="'angular-theme'"
      [themes]="themes"
      [syncConfig]="syncConfig"
      [loginConfig]="undefined"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (isReady)="onIsReady($event)"
      (objectsAdded)="onObjectsAdded($event)"
      (objectsRemoved)="onObjectsRemoved($event)"
      (objectsUpdated)="onObjectsUpdated($event)"
    ></kritzel-editor>
    <aside>
      <h3>Objects ({{ objects().length }})</h3>
      <ul>
        @for (obj of objects(); track obj.id) {
          <li>
            <span (click)="selectObject(obj)">{{ obj.__class__ }} — {{ obj.id }}</span>
            <button (click)="halveOpacity(obj)">Adjust opacity</button>
            <button (click)="deleteObject(obj)">Delete</button>
          </li>
        }
      </ul>
    </aside>
  `,
  styles: `
    :host {
      display: flex;
      height: 100%;
      font-family: Roboto, sans-serif;
    }
    kritzel-editor {
      flex: 1;
    }
    aside {
      width: 260px;
      overflow-y: auto;
      padding: 8px;
      border-left: 1px solid #ebebeb;
      font-size: 13px;
    }
    ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    li {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 0;
      border-bottom: 1px solid #eee;
    }
    span {
      flex: 1;
      word-break: break-all;
      cursor: pointer;
      color: #333333;
    }
    span:hover {
      text-decoration: underline;
      color: #dd0031;
    }
  `,
})
export class ObjectManagementInteractiveLayerPanelComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [customAngularTheme];

  syncConfig: KritzelSyncConfig = {
    providers: [InMemorySyncProvider]
  };

  objects = signal<KritzelBaseObject[]>([]);

  async onIsReady(_event: CustomEvent<EditorIsReadyEvent>) {
    await this.seedObjects();
    const all = await this.editor.getAllObjects();
    this.objects.set([...all]);
  }

  onObjectsAdded(event: CustomEvent<ObjectsAddedEvent>) {
    this.objects.update(prev => [...prev, ...event.detail.objects]);
  }

  onObjectsRemoved(event: CustomEvent<ObjectsRemovedEvent>) {
    const removedIds = new Set(event.detail.objects.map(o => o.id));
    this.objects.update(prev => prev.filter(o => !removedIds.has(o.id)));
  }

  onObjectsUpdated(_event: CustomEvent<ObjectsUpdatedEvent>) {
    this.objects.update(prev => [...prev]);
  }

  async selectObject(obj: KritzelBaseObject) {
    await this.editor.panTo(obj.translateX + obj.width / 2, obj.translateY + obj.height / 2);
    await this.editor.selectObjects([obj]);
  }

  async halveOpacity(obj: KritzelBaseObject) {
    await this.editor.updateObject(obj, { opacity: obj.opacity * 0.5 });
  }

  async deleteObject(obj: KritzelBaseObject) {
    await this.editor.removeObject(obj);
  }

  private async seedObjects() {
    await this.editor.addObject(new KritzelShape({
      translateX: -140, translateY: -170, width: 120, height: 120,
      shapeType: ShapeType.Ellipse,
      fillColor: { light: '#e3f2fd', dark: '#1a237e' },
      strokeColor: { light: '#1565c0', dark: '#90caf9' },
      strokeWidth: 3,
    }));
    await this.editor.addObject(new KritzelShape({
      translateX: 20, translateY: -150, width: 120, height: 120,
      shapeType: ShapeType.Rectangle,
      fillColor: { light: '#fce4ec', dark: '#880e4f' },
      strokeColor: { light: '#c62828', dark: '#ef9a9a' },
      strokeWidth: 3,
    }));
    await this.editor.addObject(new KritzelLine({
      startX: -170, startY: 10, endX: 130, endY: 10,
      stroke: { light: '#4caf50', dark: '#81c784' },
      strokeWidth: 3,
    }));
    const path = new KritzelPath({
      points: [[0, 0, 0.5], [15, -20, 0.5], [30, -40, 0.5], [45, -25, 0.5], [60, -10, 0.5], [75, -30, 0.5], [90, -50, 0.5], [105, -35, 0.5], [120, -20, 0.5], [135, -40, 0.5], [150, -60, 0.5], [165, -45, 0.5], [180, -30, 0.5], [195, -50, 0.5], [210, -70, 0.5], [225, -55, 0.5], [240, -40, 0.5]],
      translateX: -75, translateY: 125,
      strokeWidth: 8,
      fill: { light: '#ff9800', dark: '#ffb74d' },
    });
    path.rotation = (40 * Math.PI) / 180;
    await this.editor.addObject(path);
  }
}
