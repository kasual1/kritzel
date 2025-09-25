import { KritzelCore } from "../..";

export class KritzelWorkspace {
  __class__ = 'KritzelWorkspace';

  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  viewport: {
    translateX: number;
    translateY: number;
    scale: number;
  };

  _core: KritzelCore;

  constructor(id: string, name: string,  viewport: { translateX: number; translateY: number; scale: number } = { translateX: 0, translateY: 0, scale: 1 }) {
    this.id = id;
    this.name = name;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.viewport = viewport;
  }

  static create(core: KritzelCore, obj): KritzelWorkspace {
    const workspace = new KritzelWorkspace(obj.id, obj.name, obj.viewport);
    workspace._core = core;
    Object.assign(workspace, obj);
    return workspace;
  }

  addObject(obj: any): void {
    this._core.engine.addObject(obj);
  }

  toJSON() {
    return {
      __class__: this.__class__,
      id: this.id,
      name: this.name,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      viewport: this.viewport,
    };
  }
}
