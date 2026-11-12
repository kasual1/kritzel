import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { KritzelEditor, KritzelWorkspace, type HTMLKritzelEditorElement } from '@kritzel/react-editor';
import { createRecorderWidget, playRecordTrackScene } from './record-track-scene';

const WORKSPACE_ID = 'agentic-canvas-cursors';

const hostStyle: CSSProperties = {
  display: 'block',
  height: '100%',
};

/**
 * Agentic cursors on a generative UI page: the recorder widget is on the canvas from the start, the user asks for a new
 * track, and Studio's cursor records one with the widget's record button and leaves. The scene plays once when the
 * editor is ready; reload the page to play it again.
 */
export function AgenticCanvasCursorsInfographic() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [widget] = useState(createRecorderWidget);
  const [workspaces] = useState(() => [
    new KritzelWorkspace({ id: WORKSPACE_ID, name: 'Agentic canvas', objects: [widget] }),
  ]);

  useEffect(() => () => abortRef.current?.abort(), []);

  function onReady() {
    const editor = editorRef.current;
    if (!editor || abortRef.current) {
      return;
    }
    const abort = new AbortController();
    abortRef.current = abort;
    playRecordTrackScene(editor, widget.id, setIsWorking, abort.signal).catch(error => {
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
        // The scene shows Studio by its cursor only, not in the avatar stack.
        isAgentAvatarsVisible={false}
        style={{ display: 'block', height: '100%' }}
        onIsReady={onReady}
      />
    </div>
  );
}
