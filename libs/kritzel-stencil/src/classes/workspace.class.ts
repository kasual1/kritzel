export class KritzelWorkspace {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  viewport: {
    translateX: number;
    translateY: number;
    scale: number;
  };

  constructor(id: string, name: string, viewport: { translateX: number; translateY: number; scale: number } = { translateX: 0, translateY: 0, scale: 1 }) {
    this.id = id;
    this.name = name;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.viewport = viewport;
  }
}
