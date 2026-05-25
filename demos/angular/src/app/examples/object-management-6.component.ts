import { ChangeDetectionStrategy, Component, computed, signal, ViewChild } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
import {
  EditorIsReadyEvent,
  KritzelBaseObject,
  ObjectsAddedEvent,
  ObjectsRemovedEvent,
  ObjectsUpdatedEvent,
} from 'kritzel-stencil';

@Component({
  selector: 'app-object-management-6',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      (isReady)="onIsReady($event)"
      (objectsAdded)="onObjectsAdded($event)"
      (objectsRemoved)="onObjectsRemoved($event)"
      (objectsUpdated)="onObjectsUpdated($event)"
    ></kritzel-editor>
    <aside>
      <div class="filters">
        @for (type of availableTypes; track type) {
          <button 
            [class.active]="selectedTypes().has(type)"
            (click)="toggleFilter(type)"
          >
            {{ type }}
          </button>
        }
      </div>
      <h3>Objects ({{ filteredObjects().length }})</h3>
      <ul>
        @for (obj of filteredObjects(); track obj.id) {
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
      width: 280px;
      overflow-y: auto;
      padding: 8px;
      border-left: 1px solid #ddd;
      font-size: 13px;
    }
    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 16px;
    }
    .filters button {
      background: #f0f0f0;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 4px 8px;
      cursor: pointer;
    }
    .filters button.active {
      background: #007bff;
      color: white;
      border-color: #0056b3;
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
export class ObjectManagement6Component {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  allObjects = signal<KritzelBaseObject[]>([]);
  availableTypes = ['KritzelPath', 'KritzelText', 'KritzelShape', 'KritzelImage', 'KritzelLine'];
  selectedTypes = signal<Set<string>>(new Set(['KritzelPath', 'KritzelText', 'KritzelShape', 'KritzelImage', 'KritzelLine']));

  filteredObjects = computed(() => {
    const types = this.selectedTypes();
    return this.allObjects().filter(obj => types.has(obj.__class__));
  });

  async onIsReady(_event: CustomEvent<EditorIsReadyEvent>) {
    const objects = await this.editor.getAllObjects();
    this.allObjects.set([...objects]);
    await this.applyOpacityFilter();
  }

  async onObjectsAdded(event: CustomEvent<ObjectsAddedEvent>) {
    this.allObjects.update(prev => [...prev, ...event.detail.objects]);
    await this.applyOpacityFilter();
  }

  onObjectsRemoved(event: CustomEvent<ObjectsRemovedEvent>) {
    const removedIds = new Set(event.detail.objects.map(o => o.id));
    this.allObjects.update(prev => prev.filter(o => !removedIds.has(o.id)));
  }

  onObjectsUpdated(event: CustomEvent<ObjectsUpdatedEvent>) {
    const updatedMap = new Map(event.detail.objects.map(o => [o.object.id, o.object]));
    this.allObjects.update(prev => prev.map(o => updatedMap.get(o.id) || o));
  }

  async toggleFilter(type: string) {
    this.selectedTypes.update(types => {
      const newTypes = new Set(types);
      if (newTypes.has(type)) {
        newTypes.delete(type);
      } else {
        newTypes.add(type);
      }
      return newTypes;
    });
    await this.applyOpacityFilter();
  }

  async applyOpacityFilter() {
    const types = this.selectedTypes();
    const updates = this.allObjects()
      .map(obj => {
        const targetOpacity = types.has(obj.__class__) ? 1 : 0.5;
        const currentOpacity = obj.opacity ?? 1;
        if (currentOpacity !== targetOpacity) {
          return this.editor.updateObject(obj, { opacity: targetOpacity });
        }
        return Promise.resolve(null);
      });
    await Promise.all(updates);
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
