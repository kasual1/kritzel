export interface KritzelSelection {
  stroke: {
    color: string;
    size: number;
    style: 'solid' | 'dashed';
  };
  handles: {
    color: string;
    size: number;
  }
}
