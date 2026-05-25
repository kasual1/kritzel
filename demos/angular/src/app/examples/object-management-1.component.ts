import { ChangeDetectionStrategy, Component, signal, ViewChild } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
import { EditorIsReadyEvent, KritzelBaseObject } from 'kritzel-stencil';

@Component({
  selector: 'app-object-management-1',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor (isReady)="onIsReady($event)"></kritzel-editor>
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
export class ObjectManagement1Component {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  objects = signal<KritzelBaseObject[]>([]);

  async onIsReady(_event: CustomEvent<EditorIsReadyEvent>) {
    const all = await this.editor.getAllObjects();
    this.objects.set(all);
  }
}
