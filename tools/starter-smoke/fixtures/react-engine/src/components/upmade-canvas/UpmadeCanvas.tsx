import { useCallback, useRef, useState } from 'react';
import {
  UpmadeBrushTool,
  UpmadeEngine,
  UpmadeEraserTool,
  UpmadeSelectionTool,
  type HTMLUpmadeEngineElement,
} from '@upmade/react-engine';

const editorId = 'upmade-canvas';
const canvasStyle = { display: 'block', width: '100%', height: 480 };

export function UpmadeCanvas() {
  const engineRef = useRef<HTMLUpmadeEngineElement>(null);
  const [initializationError, setInitializationError] = useState('');

  const initializeEngine = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) {
      setInitializationError('The Upmade engine element is not available.');
      return;
    }

    try {
      if (!(await engine.registerTool('selection', UpmadeSelectionTool))) {
        throw new Error('Upmade could not register the selection tool.');
      }
      if (!(await engine.registerTool('brush', UpmadeBrushTool))) {
        throw new Error('Upmade could not register the brush tool.');
      }
      if (!(await engine.registerTool('eraser', UpmadeEraserTool))) {
        throw new Error('Upmade could not register the eraser tool.');
      }
      await engine.setActiveTool('brush');
    } catch (error: unknown) {
      setInitializationError(error instanceof Error ? error.message : String(error));
    }
  }, []);

  return (
    <section>
      <UpmadeEngine
        ref={engineRef}
        editorId={editorId}
        onIsEngineReady={() => { void initializeEngine(); }}
        style={canvasStyle}
        aria-label="Upmade canvas"
      />
      {initializationError && <p role="alert">{initializationError}</p>}
    </section>
  );
}
