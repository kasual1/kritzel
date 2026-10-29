import { useCallback, useRef, useState, type CSSProperties } from 'react';
import {
  KritzelEditor,
  KritzelWorkspace,
  type HTMLKritzelEditorElement,
  type KritzelObjectConfig,
  type KritzelObjectTitlebarActionEvent,
  type KritzelObjectTitlebarConfig,
} from '@kritzel/react-editor';
import { CanvasAgent } from './canvas-agent';
import { createFrameDocument, isFrame } from './frame';
import { FramePreview } from './FramePreview';
import { createWelcomeFrame } from './welcome-frame';

const WORKSPACE_ID = 'agentic-canvas';
const CURSOR_ID = 'claude';

const hostStyle = {
  display: 'block',
  height: '100%',
  // Frames resize from their corners like in a design tool, without the corner squares.
  '--kritzel-selection-resize-handle-visibility': 'hidden',
} as CSSProperties;

/** Frames get a titlebar and keep their orientation, like frames in a design tool. */
const objectConfig: KritzelObjectConfig = {
  hasTitlebar: isFrame,
  isRotatable: false,
};

const objectTitlebar: KritzelObjectTitlebarConfig = {
  left: [
    { id: 'title', type: 'title', isEditable: true },
    {
      id: 'size',
      type: 'text',
      tone: 'muted',
      minBarWidth: 180,
      text: ({ contentSize }) => `${Math.round(contentSize.width)} × ${Math.round(contentSize.height)}`,
    },
  ],
  right: [{ id: 'play', type: 'button', icon: 'play', tooltip: 'Open fullscreen' }],
};

interface Preview {
  title: string;
  document: string;
}

export function AgenticCanvasInfographic() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const agentRef = useRef<CanvasAgent | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [workspaces] = useState(() => [
    new KritzelWorkspace({ id: WORKSPACE_ID, name: 'Agentic canvas', objects: [createWelcomeFrame(CanvasAgent.hasApiKey)] }),
  ]);

  async function onReady() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    await editor.addAgenticCursor({ id: CURSOR_ID, name: 'Claude', color: '#d97757', visible: false });
    agentRef.current = new CanvasAgent(editor, {
      onStatus: status => void editor.updateAgenticCursor(CURSOR_ID, { status }),
      onFrameFocus: frameId => void editor.moveAgenticCursor(CURSOR_ID, { objectId: frameId }),
    });
    await editor.centerAllObjects(false);
  }

  async function onChatSubmit(prompt: string) {
    const editor = editorRef.current;
    const agent = agentRef.current;
    if (!editor || !agent || abortRef.current) {
      return;
    }

    const abort = new AbortController();
    abortRef.current = abort;
    setIsWorking(true);
    await editor.updateAgenticCursor(CURSOR_ID, { visible: true, status: 'Thinking…' });

    let status: string;
    if (!CanvasAgent.hasApiKey) {
      status = 'Add your API key in agent-config.ts';
    } else {
      try {
        status = await agent.send(prompt, abort.signal);
      } catch (error) {
        status = abort.signal.aborted ? 'Stopped' : error instanceof Error ? error.message : 'Something went wrong';
        console.error(error);
      }
    }

    abortRef.current = null;
    setIsWorking(false);
    await editor.updateAgenticCursor(CURSOR_ID, { status });
  }

  async function onTitlebarAction({ elementId, objectId }: KritzelObjectTitlebarActionEvent) {
    const frame = await editorRef.current?.getObjectById(objectId);
    if (elementId !== 'play' || !frame || !isFrame(frame)) {
      return;
    }
    const title = frame.name ?? frame.title;
    setPreview({ title, document: createFrameDocument(frame.content, title) });
  }

  const closePreview = useCallback(() => setPreview(null), []);

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
        onIsReady={() => void onReady()}
        onChatSubmit={event => void onChatSubmit(event.detail)}
        onChatStop={() => abortRef.current?.abort()}
        onObjectTitlebarAction={event => void onTitlebarAction(event.detail)}
      />
      {preview && <FramePreview title={preview.title} document={preview.document} onClose={closePreview} />}
    </div>
  );
}
