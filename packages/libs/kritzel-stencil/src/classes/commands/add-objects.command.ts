import { KritzelStore } from '../../stores/store';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBaseCommand } from './base.command';

export class AddObjectsCommand extends KritzelBaseCommand {
  private objects: KritzelBaseObject<any>[];

  private previousSelectionGroup: KritzelSelectionGroup;

  constructor(store: KritzelStore, objects: KritzelBaseObject<any>[]) {
    super(store);
    this.objects = objects;
    this.previousSelectionGroup = this._store.state.selectionGroup;
  }

  execute(): void {
    this._store.state.objects = [...this._store.state.objects, ...this.objects];

    this.objects.forEach(object => {
      if (object instanceof KritzelSelectionGroup) {
        this._store.state.selectionGroup = object;
      }
    });
  }

  undo(): void {
    this._store.state.objects = this._store.state.objects.filter(object => {
      return !this.objects.includes(object);
    });

    this.objects.forEach(object => {
      if (object instanceof KritzelSelectionGroup) {
        this._store.state.selectionGroup = this.previousSelectionGroup;
      }
    });
  }
}
