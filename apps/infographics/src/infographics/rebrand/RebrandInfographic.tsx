import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { UpmadeEditor, UpmadeWorkspace, type HTMLUpmadeEditorElement } from '@upmade/react-editor';
import { playRebrandScene } from './rebrand-scene';

const WORKSPACE_ID = 'rebrand';

const hostStyle: CSSProperties = {
  display: 'block',
  height: '100%',
};

/**
 * Kritzel is now Upmade: the old logo, an arrow and the new logo are added one after another on a plain canvas.
 * The scene plays once when the editor is ready; reload to play it again.
 */
export function RebrandInfographic() {
  const editorRef = useRef<HTMLUpmadeEditorElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [workspaces] = useState(() => [
    new UpmadeWorkspace({ id: WORKSPACE_ID, name: 'Kritzel is now Upmade', objects: [] }),
  ]);

  useEffect(() => () => abortRef.current?.abort(), []);

  function onReady() {
    const editor = editorRef.current;
    if (!editor || abortRef.current) {
      return;
    }
    const abort = new AbortController();
    abortRef.current = abort;
    playRebrandScene(editor, abort.signal).catch(error => {
      if (!abort.signal.aborted) {
        console.error(error);
      }
    });
  }

  return (
    <div style={hostStyle}>
      <UpmadeEditor
        ref={editorRef}
        editorId="infographic-rebrand"
        workspaces={workspaces}
        activeWorkspaceId={WORKSPACE_ID}
        isWorkspaceManagerVisible={false}
        isMoreMenuVisible={false}
        isZoomPanelVisible={false}
        style={{ display: 'block', height: '100%' }}
        onIsReady={onReady}
      />
    </div>
  );
}
