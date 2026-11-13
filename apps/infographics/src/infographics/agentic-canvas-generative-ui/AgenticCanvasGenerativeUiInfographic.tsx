import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { UpdrawEditor, UpdrawWorkspace, type HTMLUpdrawEditorElement } from '@updraw/react-editor';
import { playRecorderScene } from './recorder-scene';

const WORKSPACE_ID = 'agentic-canvas-generative-ui';

const hostStyle: CSSProperties = {
  display: 'block',
  height: '100%',
};

/**
 * Generative UI on the agentic canvas: the prompt "Please generate a recorder widget" adds the recorder widget in the
 * middle of the canvas, which is cleared again shortly after. The scene plays once when the editor is ready; reload to play it again.
 */
export function AgenticCanvasGenerativeUiInfographic() {
  const editorRef = useRef<HTMLUpdrawEditorElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [workspaces] = useState(() => [
    new UpdrawWorkspace({ id: WORKSPACE_ID, name: 'Agentic canvas generative UI', objects: [] }),
  ]);

  useEffect(() => () => abortRef.current?.abort(), []);

  function onReady() {
    const editor = editorRef.current;
    if (!editor || abortRef.current) {
      return;
    }
    const abort = new AbortController();
    abortRef.current = abort;
    playRecorderScene(editor, setIsWorking, abort.signal).catch(error => {
      if (!abort.signal.aborted) {
        console.error(error);
      }
    });
  }

  return (
    <div style={hostStyle}>
      <UpdrawEditor
        ref={editorRef}
        editorId="infographic-agentic-canvas-generative-ui"
        workspaces={workspaces}
        activeWorkspaceId={WORKSPACE_ID}
        isChatBoxVisible={true}
        isChatBoxLoading={isWorking}
        isWorkspaceManagerVisible={false}
        isMoreMenuVisible={false}
        isZoomPanelVisible={false}
        // The Studio agent works with a hidden cursor and shows nowhere else either.
        isAgentAvatarsVisible={false}
        style={{ display: 'block', height: '100%' }}
        onIsReady={onReady}
      />
    </div>
  );
}
