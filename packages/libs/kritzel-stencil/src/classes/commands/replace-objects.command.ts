import { KritzelStore } from '../../stores/store';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KrtizelSelectionBox } from '../objects/selection-box.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBaseCommand } from './base.command';

export class ReplaceObjectsCommand extends KritzelBaseCommand {
  
  private objects: KritzelBaseObject<any>[];
  
  private objectsBeforeReplacement: KritzelBaseObject<any>[];

  private previousSelectionGroup: KritzelSelectionGroup;

  constructor(store: KritzelStore, objects: KritzelBaseObject<any>[]) {
    super(store);
    this.objects = objects.filter(object => !(object instanceof KrtizelSelectionBox));
    this.objectsBeforeReplacement = this._store.state.objects;
    this.previousSelectionGroup = this._store.state.selectionGroup;
  }

  execute(): void {
    const objects = this._store.state.objects.filter(object => {
      return !this.objects.includes(object);
    });

    this._store.state.objects = [...objects, ...this.objects];

    this.objects.forEach(object => {
      if (object instanceof KritzelSelectionGroup) {
        this._store.state.selectionGroup = object;
      }
    });
  }

  undo(): void {
    this._store.state.objects = this.objectsBeforeReplacement;

    this.objects.forEach(object => {
      if (object instanceof KritzelSelectionGroup) {
        this._store.state.selectionGroup = this.previousSelectionGroup;
      }
    });
  }
}
