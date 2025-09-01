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

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.viewport = {
      translateX: 0,
      translateY: 0,
      scale: 1,
    };
  }

  
}
