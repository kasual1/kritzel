export interface KritzelSelection {
  stroke: {
    color: string;
    size: number;
    style: 'solid' | 'dashed';
  };
  handles: {
    color: string;
    size: number;
    onMouseDown: (event: MouseEvent) => void;
    onMouseMove: (event: MouseEvent) => void;
    onMouseUp: (event: MouseEvent) => void;
  }
}
