import { KritzelTool } from '../../components';
import { KritzelSerializable } from '../../interfaces/serializable.interface';
import { KritzelCore } from '../core/core.class';

export class KritzelBaseTool implements KritzelTool, KritzelSerializable {
  __class__: string = this.constructor.name;

  name: string = 'base-tool';

  protected readonly _core: KritzelCore;

  constructor(core: KritzelCore) {
    this._core = core;
    void this._core; // Avoid unused variable warning
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

  deserialize(object: any): KritzelSerializable {
    Object.assign(this, object);
    return this;
  }
}
