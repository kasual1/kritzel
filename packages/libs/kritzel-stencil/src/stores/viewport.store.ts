import { createStore } from '@stencil/store';

export interface KritzelViewportState {
  cursorX: number;
  cursorY: number;
  scale: number;
  scaleMax: number;
  scaleMin: number;
  scaleStep: number;
  startX: number;
  startY: number;
  translateX: number;
  translateY: number;
}

const { state: kritzelViewportState, set: setKritzelViewportState } = createStore<KritzelViewportState>({
  cursorX: 0,
  cursorY: 0,
  scale: 1,
  scaleMax: 1000,
  scaleMin: 0.0001,
  scaleStep: 0.05,
  startX: 0,
  startY: 0,
  translateX: 0,
  translateY: 0,
});

export { kritzelViewportState, setKritzelViewportState };
