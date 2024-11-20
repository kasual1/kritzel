import { createStore } from "@stencil/store";
import { Path } from "../classes/path.class";
import { Drawing } from "../interfaces/drawing.interface";

interface KritzelEngineState {
  startX: number;
  startY: number;
  cursorX: number;
  cursorY: number;
  translateX: number;
  translateY: number;
  isDragging: boolean;
  isDrawing: boolean;
  currentPathPoints: number[][];
  currentPath?: Path;
  scale: number;
  showDebugPanel: boolean;
  drawing: Drawing;
  scaleStep: number;
  scaleMax: number;
  scaleMin: number;
}

const { state } = createStore<KritzelEngineState>({
  currentPathPoints: [],
  cursorX: 0,
  cursorY: 0,
  drawing: {
    id: '1',
    releaseDate: new Date(),
    paths: [],
    translateX: 0,
    translateY: 0,
  },
  isDragging: false,
  isDrawing: false,
  scale: 1,
  scaleMax: 1000,
  scaleMin: 0.0001,
  scaleStep: 0.05,
  showDebugPanel: false,
  startX: 0,
  startY: 0,
  translateX: 0,
  translateY: 0,
});

export default state;
