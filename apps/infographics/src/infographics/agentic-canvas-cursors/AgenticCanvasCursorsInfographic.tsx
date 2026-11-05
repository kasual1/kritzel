import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { KritzelEditor, KritzelWorkspace, type HTMLKritzelEditorElement } from '@kritzel/react-editor';
import { createRecorderObjects, playAgenticCanvasCursorsScene } from './favorite-track-scene';

const WORKSPACE_ID = 'agentic-canvas-cursors';

const hostStyle: CSSProperties = {
  display: 'block',
  height: '100%',
};

/**
 * Agentic cursors on a generative UI page: the canvas starts with the recorder widget and its tracks, the user asks
 * for track 2 to be a favorite, and Studio's cursor clicks its star. The scene plays once when the editor is ready;
 * reload the page to play it again.
 */
export function AgenticCanvasCursorsInfographic() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [objects] = useState(createRecorderObjects);
  const [workspaces] = useState(() => [
    new KritzelWorkspace({ id: WORKSPACE_ID, name: 'Agentic canvas', objects }),
  ]);

  useEffect(() => () => abortRef.current?.abort(), []);

  function onReady() {
    const editor = editorRef.current;
    if (!editor || abortRef.current) {
      return;
    }
    const abort = new AbortController();
    abortRef.current = abort;
    const trackIds = objects.slice(1).map(object => object.id);
    playAgenticCanvasCursorsScene(editor, trackIds, setIsWorking, abort.signal).catch(error => {
      if (!abort.signal.aborted) {
        console.error(error);
      }
    });
  }

  return (
    <div style={hostStyle}>
      <KritzelEditor
        ref={editorRef}
        editorId="infographic-agentic-canvas-cursors"
        workspaces={workspaces}
        activeWorkspaceId={WORKSPACE_ID}
        isChatBoxVisible
        isChatBoxLoading={isWorking}
        isWorkspaceManagerVisible={false}
        isMoreMenuVisible={false}
        isZoomPanelVisible={false}
        style={{ display: 'block', height: '100%' }}
        onIsReady={onReady}
      />
    </div>
  );
}
