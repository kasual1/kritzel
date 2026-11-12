import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { KritzelEditor, KritzelWorkspace, type HTMLKritzelEditorElement } from '@kritzel/react-editor';
import { playRectangleScene } from './rectangle-scene';

const WORKSPACE_ID = 'agentic-canvas-rectangle';

const hostStyle: CSSProperties = {
  display: 'block',
  height: '100%',
};

/**
 * The agentic canvas at its simplest: the prompt "Please add a rectangle" adds a rectangle in the middle of the canvas,
 * which is removed again 1.5 seconds later. The scene plays once when the editor is ready; reload to play it again.
 */
export function AgenticCanvasRectangleInfographic() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [workspaces] = useState(() => [
    new KritzelWorkspace({ id: WORKSPACE_ID, name: 'Agentic canvas rectangle', objects: [] }),
  ]);

  useEffect(() => () => abortRef.current?.abort(), []);

  function onReady() {
    const editor = editorRef.current;
    if (!editor || abortRef.current) {
      return;
    }
    const abort = new AbortController();
    abortRef.current = abort;
    playRectangleScene(editor, setIsWorking, abort.signal).catch(error => {
      if (!abort.signal.aborted) {
        console.error(error);
      }
    });
  }

  return (
    <div style={hostStyle}>
      <KritzelEditor
        ref={editorRef}
        editorId="infographic-agentic-canvas-rectangle"
        workspaces={workspaces}
        activeWorkspaceId={WORKSPACE_ID}
        isChatBoxVisible={true}
        isChatBoxLoading={isWorking}
        isWorkspaceManagerVisible={false}
        isMoreMenuVisible={false}
        isZoomPanelVisible={false}
        // The scene has no agents, so the avatar stack stays hidden.
        isAgentAvatarsVisible={false}
        style={{ display: 'block', height: '100%' }}
        onIsReady={onReady}
      />
    </div>
  );
}
