export const reactEngineFiles = [
  {
    path: 'KritzelCanvas.tsx',
    content: `import { useCallback, useRef, useState } from 'react';
import {
  KritzelBrushTool,
  KritzelEngine,
  KritzelEraserTool,
  KritzelSelectionTool,
  type HTMLKritzelEngineElement,
} from '@kritzel/react-engine';

const editorId = 'kritzel-canvas';
const canvasStyle = { display: 'block', width: '100%', height: 480 };

export function KritzelCanvas() {
  const engineRef = useRef<HTMLKritzelEngineElement>(null);
  const [initializationError, setInitializationError] = useState('');

  const initializeEngine = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) {
      setInitializationError('The Kritzel engine element is not available.');
      return;
    }

    try {
      if (!(await engine.registerTool('selection', KritzelSelectionTool))) {
        throw new Error('Kritzel could not register the selection tool.');
      }
      if (!(await engine.registerTool('brush', KritzelBrushTool))) {
        throw new Error('Kritzel could not register the brush tool.');
      }
      if (!(await engine.registerTool('eraser', KritzelEraserTool))) {
        throw new Error('Kritzel could not register the eraser tool.');
      }
      await engine.setActiveTool('brush');
    } catch (error: unknown) {
      setInitializationError(error instanceof Error ? error.message : String(error));
    }
  }, []);

  return (
    <section>
      <KritzelEngine
        ref={engineRef}
        editorId={editorId}
        onIsEngineReady={() => { void initializeEngine(); }}
        style={canvasStyle}
        aria-label="Kritzel canvas"
      />
      {initializationError && <p role="alert">{initializationError}</p>}
    </section>
  );
}
`,
  },
];
