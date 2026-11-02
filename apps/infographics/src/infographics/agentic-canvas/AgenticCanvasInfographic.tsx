import { useRef, useState, type CSSProperties } from 'react';
import {
  KritzelEditor,
  KritzelWorkspace,
  type HTMLKritzelEditorElement,
  type KritzelObjectConfig,
  type KritzelObjectTitlebarConfig,
} from '@kritzel/react-editor';
import { CanvasAgent, isIframe } from './canvas-agent';

const WORKSPACE_ID = 'agentic-canvas';

const hostStyle: CSSProperties = {
  display: 'block',
  height: '100%',
};

/** The iframe objects Claude adds get a titlebar. */
const objectConfig: KritzelObjectConfig = {
  hasTitlebar: isIframe,
};

/** The titlebar shows the object's name, which users can rename by clicking it while the object is selected. */
const objectTitlebar: KritzelObjectTitlebarConfig = {
  left: [{ id: 'title', type: 'title', isEditable: true }],
};

/** An editor with the chat box instead of the toolbar: every prompt lets Claude add iframe objects to the canvas. */
export function AgenticCanvasInfographic() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const agentRef = useRef<CanvasAgent | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [workspaces] = useState(() => [
    new KritzelWorkspace({ id: WORKSPACE_ID, name: 'Agentic canvas', objects: [] }),
  ]);

  async function onChatSubmit(prompt: string) {
    const editor = editorRef.current;
    if (!editor || abortRef.current) {
      return;
    }
    if (!CanvasAgent.hasApiKey) {
      console.warn('Add VITE_ANTHROPIC_API_KEY to the .env file at the repository root and restart the dev server.');
      return;
    }

    agentRef.current ??= new CanvasAgent(editor);
    const abort = new AbortController();
    abortRef.current = abort;
    setIsWorking(true);

    try {
      await agentRef.current.send(prompt, abort.signal);
    } catch (error) {
      if (!abort.signal.aborted) {
        console.error(error);
      }
    } finally {
      abortRef.current = null;
      setIsWorking(false);
    }
  }

  return (
    <div style={hostStyle}>
      <KritzelEditor
        ref={editorRef}
        editorId="infographic-agentic-canvas"
        workspaces={workspaces}
        activeWorkspaceId={WORKSPACE_ID}
        objectConfig={objectConfig}
        objectTitlebar={objectTitlebar}
        isChatBoxVisible
        isChatBoxLoading={isWorking}
        isWorkspaceManagerVisible={false}
        onChatSubmit={event => void onChatSubmit(event.detail)}
        onChatStop={() => abortRef.current?.abort()}
      />
    </div>
  );
}
