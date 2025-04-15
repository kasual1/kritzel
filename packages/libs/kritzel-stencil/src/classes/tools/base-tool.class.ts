import { KritzelTool } from '../../components';
import { KritzelSerializable } from '../../interfaces/serializable.interface';
import { KritzelStore } from '../store.class';

export class KritzelBaseTool implements KritzelTool, KritzelSerializable {
  __class__: string = this.constructor.name;

  name: string = 'base-tool';
  icon: string = 'base-tool';

  protected readonly _store: KritzelStore;

  constructor(store: KritzelStore) {
    this._store = store;
    void this._store; // Avoid unused variable warning
  }

  handleMouseDown(_event: MouseEvent): void {
    // default implementation
  }

  handleMouseMove(_event: MouseEvent): void {
    // default implementation
  }

  handleMouseUp(_event: MouseEvent): void {
    // default implementation
  }

  handleTouchStart(_event: TouchEvent): void {
    // default implementation
  }

  handleTouchMove(_event: TouchEvent): void {
    // default implementation
  }

  handleTouchEnd(_event: TouchEvent): void {
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
