import { KritzelTool } from '../../components';
import { KritzelSerializable } from '../../interfaces/serializable.interface';
import { KritzelStore } from '../store.class';

export class KritzelBaseTool implements KritzelTool, KritzelSerializable {
  __class__: string = this.constructor.name;

  name: string = 'base-tool';

  protected readonly _store: KritzelStore;

  constructor(store: KritzelStore) {
    this._store = store;
    void this._store; // Avoid unused variable warning
  }

  onActivate(): void {
    // default implementation
  }

  onDeactivate(): void {
    // default implementation
  }

  handlePointerDown(_event: PointerEvent): void {
    // default implementation
  }

  handlePointerMove(_event: PointerEvent): void {
    // default implementation
  }

  handlePointerUp(_event: PointerEvent): void {
    // default implementation
  }

  handleWheel(_event: WheelEvent): void {
    // default implementation
  }

  revive(object: any): KritzelSerializable {
    Object.assign(this, object);
    return this;
  }
}
