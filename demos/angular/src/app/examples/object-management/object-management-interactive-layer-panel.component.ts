import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
import {
  EditorIsReadyEvent,
  KritzelBaseObject,
  ObjectsAddedEvent,
  ObjectsRemovedEvent,
  ObjectsUpdatedEvent,
} from 'kritzel-stencil';
import { customAngularTheme } from '../../const/custom-angular-theme';

@Component({
  selector: 'app-object-management-interactive-layer-panel',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      [theme]="'angular-theme'"
      [themes]="themes"
      [loginConfig]="undefined"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (isReady)="onIsReady($event)"
      (objectsAdded)="onObjectsAdded($event)"
      (objectsRemoved)="onObjectsRemoved($event)"
      (objectsUpdated)="onObjectsUpdated($event)"
    ></kritzel-editor>
    <aside>
      <h3>Layers ({{ objects().length }})</h3>
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
    }
    kritzel-editor {
      flex: 1;
    }
    aside {
      width: 260px;
      overflow-y: auto;
      padding: 8px;
      border-left: 1px solid #ddd;
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
    }
    span:hover {
      text-decoration: underline;
    }
  `,
})
export class ObjectManagementInteractiveLayerPanelComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [customAngularTheme];

  objects = signal<KritzelBaseObject[]>([]);

  async onIsReady(_event: CustomEvent<EditorIsReadyEvent>) {
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
    await this.editor.selectObjects([obj]);
  }

  async halveOpacity(obj: KritzelBaseObject) {
    await this.editor.updateObject(obj, { opacity: obj.opacity * 0.5 });
  }

  async deleteObject(obj: KritzelBaseObject) {
    await this.editor.removeObject(obj);
  }
}
