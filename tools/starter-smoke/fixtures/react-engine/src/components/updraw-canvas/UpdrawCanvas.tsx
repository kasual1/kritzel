import { useCallback, useRef, useState } from 'react';
import {
  UpdrawBrushTool,
  UpdrawEngine,
  UpdrawEraserTool,
  UpdrawSelectionTool,
  type HTMLUpdrawEngineElement,
} from '@updraw/react-engine';

const editorId = 'updraw-canvas';
const canvasStyle = { display: 'block', width: '100%', height: 480 };

export function UpdrawCanvas() {
  const engineRef = useRef<HTMLUpdrawEngineElement>(null);
  const [initializationError, setInitializationError] = useState('');

  const initializeEngine = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) {
      setInitializationError('The Updraw engine element is not available.');
      return;
    }

    try {
      if (!(await engine.registerTool('selection', UpdrawSelectionTool))) {
        throw new Error('Updraw could not register the selection tool.');
      }
      if (!(await engine.registerTool('brush', UpdrawBrushTool))) {
        throw new Error('Updraw could not register the brush tool.');
      }
      if (!(await engine.registerTool('eraser', UpdrawEraserTool))) {
        throw new Error('Updraw could not register the eraser tool.');
      }
      await engine.setActiveTool('brush');
    } catch (error: unknown) {
      setInitializationError(error instanceof Error ? error.message : String(error));
    }
  }, []);

  return (
    <section>
      <UpdrawEngine
        ref={engineRef}
        editorId={editorId}
        onIsEngineReady={() => { void initializeEngine(); }}
        style={canvasStyle}
        aria-label="Updraw canvas"
      />
      {initializationError && <p role="alert">{initializationError}</p>}
    </section>
  );
}
