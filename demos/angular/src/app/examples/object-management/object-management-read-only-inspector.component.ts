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
  selector: 'app-object-management-read-only-inspector',
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
      <h3>Objects ({{ objects().length }})</h3>
      <ul>
        @for (obj of objects(); track obj.id) {
          <li>{{ obj.__class__ }} — {{ obj.id }}</li>
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
      width: 240px;
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
      padding: 4px 0;
      border-bottom: 1px solid #eee;
      word-break: break-all;
    }
  `,
})
export class ObjectManagementReadOnlyInspectorComponent {
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
}
