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
import { WelcomeMessage } from './WelcomeMessage';

const WORKSPACE_ID = 'agentic-canvas';

const hostStyle = {
  position: 'relative',
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
  const [hasFrames, setHasFrames] = useState(false);
  const [workspaces] = useState(() => [
    new KritzelWorkspace({ id: WORKSPACE_ID, name: 'Agentic canvas', objects: [] }),
  ]);

  function onReady() {
    if (editorRef.current) {
      agentRef.current = new CanvasAgent(editorRef.current);
    }
  }

  async function onChatSubmit(prompt: string) {
    const agent = agentRef.current;
    if (!agent || abortRef.current) {
      return;
    }

    const abort = new AbortController();
    abortRef.current = abort;
    setIsWorking(true);

    if (CanvasAgent.hasApiKey) {
      try {
        await agent.send(prompt, abort.signal);
      } catch (error) {
        if (!abort.signal.aborted) {
          console.error(error);
        }
      }
    }

    abortRef.current = null;
    setIsWorking(false);
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
        onIsReady={onReady}
        onChatSubmit={event => void onChatSubmit(event.detail)}
        onChatStop={() => abortRef.current?.abort()}
        onObjectsChange={event => setHasFrames(event.detail.some(isFrame))}
        onObjectTitlebarAction={event => void onTitlebarAction(event.detail)}
      />
      <WelcomeMessage isVisible={!hasFrames && !isWorking} hasApiKey={CanvasAgent.hasApiKey} />
      {preview && <FramePreview title={preview.title} document={preview.document} onClose={closePreview} />}
    </div>
  );
}
