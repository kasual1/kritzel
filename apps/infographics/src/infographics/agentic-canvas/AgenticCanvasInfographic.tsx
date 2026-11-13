import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { UpdrawEditor, UpdrawWorkspace, type HTMLUpdrawEditorElement } from '@updraw/react-editor';
import { playHeroScene } from './hero-scene';

const WORKSPACE_ID = 'agentic-canvas';

const hostStyle: CSSProperties = {
  display: 'block',
  height: '100%',
};

/**
 * Hero of the "What is an agentic canvas?" blog post: three agents help a musician release the jazz song "Full Control".
 * The scene plays once when the editor is ready; reload the page to play it again.
 */
export function AgenticCanvasInfographic() {
  const editorRef = useRef<HTMLUpdrawEditorElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [workspaces] = useState(() => [
    new UpdrawWorkspace({ id: WORKSPACE_ID, name: 'Agentic canvas', objects: [] }),
  ]);

  useEffect(() => () => abortRef.current?.abort(), []);

  function onReady() {
    const editor = editorRef.current;
    if (!editor || abortRef.current) {
      return;
    }
    const abort = new AbortController();
    abortRef.current = abort;
    playHeroScene(editor, setIsWorking, abort.signal).catch(error => {
      if (!abort.signal.aborted) {
        console.error(error);
      }
    });
  }

  return (
    <div style={hostStyle}>
      <UpdrawEditor
        ref={editorRef}
        editorId="infographic-agentic-canvas"
        workspaces={workspaces}
        activeWorkspaceId={WORKSPACE_ID}
        isChatBoxVisible
        isChatBoxLoading={isWorking}
        isWorkspaceManagerVisible={false}
        isMoreMenuVisible={false}
        isZoomPanelVisible={false}
        // The scene shows the agents by their cursors only, not in the avatar stack.
        isAgentAvatarsVisible={false}
        style={{ display: 'block', height: '100%' }}
        onIsReady={onReady}
      />
    </div>
  );
}
