import { useRef, useState, type CSSProperties } from 'react';
import {
  KritzelEditor,
  KritzelWorkspace,
  type HTMLKritzelEditorElement,
  type KritzelObjectConfig,
  type KritzelObjectTitlebarConfig,
} from '@kritzel/react-editor';
import { CanvasAgent, describeError, isIframe, MISSING_API_KEY_MESSAGE } from './canvas-agent';

const WORKSPACE_ID = 'agentic-canvas';

const hostStyle: CSSProperties = {
  position: 'relative',
  display: 'block',
  height: '100%',
};

/** Sits above the chat box and lets clicks through to the canvas. */
const noticeStyle: CSSProperties = {
  position: 'absolute',
  left: '50%',
  bottom: 96,
  transform: 'translateX(-50%)',
  width: 'max-content',
  maxWidth: 'min(560px, calc(100% - 32px))',
  margin: 0,
  padding: '10px 14px',
  borderRadius: 12,
  boxShadow: '0 4px 16px rgba(20, 18, 31, 0.08)',
  font: '14px/1.45 system-ui, sans-serif',
  whiteSpace: 'pre-wrap',
  pointerEvents: 'none',
};

const infoStyle: CSSProperties = { ...noticeStyle, background: '#ffffff', color: '#3f3f46', border: '1px solid #e4e4e7' };
const errorStyle: CSSProperties = { ...noticeStyle, background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' };

/** The iframe objects Claude adds get a titlebar. */
const objectConfig: KritzelObjectConfig = {
  hasTitlebar: isIframe,
};

/** The titlebar shows the object's name, which users can rename by clicking it while the object is selected. */
const objectTitlebar: KritzelObjectTitlebarConfig = {
  left: [{ id: 'title', type: 'title', isEditable: true }],
};

interface Notice {
  text: string;
  isError: boolean;
}

/** An editor with the chat box instead of the toolbar: every prompt lets Claude add iframe objects to the canvas. */
export function AgenticCanvasInfographic() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const agentRef = useRef<CanvasAgent | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [workspaces] = useState(() => [
    new KritzelWorkspace({ id: WORKSPACE_ID, name: 'Agentic canvas', objects: [] }),
  ]);

  async function onChatSubmit(prompt: string) {
    const editor = editorRef.current;
    if (!editor || abortRef.current) {
      return;
    }
    if (!CanvasAgent.hasApiKey) {
      setNotice({ text: MISSING_API_KEY_MESSAGE, isError: true });
      return;
    }

    agentRef.current ??= new CanvasAgent(editor);
    const abort = new AbortController();
    abortRef.current = abort;
    setIsWorking(true);
    setNotice({ text: 'Claude is building it. This can take a minute.', isError: false });

    try {
      const reply = await agentRef.current.send(prompt, abort.signal);
      setNotice(reply ? { text: reply, isError: false } : null);
    } catch (error) {
      if (abort.signal.aborted) {
        setNotice(null);
      } else {
        console.error(error);
        setNotice({ text: describeError(error), isError: true });
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
      {notice && (
        <p style={notice.isError ? errorStyle : infoStyle} role={notice.isError ? 'alert' : 'status'}>
          {notice.text}
        </p>
      )}
    </div>
  );
}
