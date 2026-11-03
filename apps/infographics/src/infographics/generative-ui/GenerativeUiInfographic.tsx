import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  KritzelEditor,
  KritzelWorkspace,
  type HTMLKritzelEditorElement,
  type KritzelBaseObject,
  type KritzelObjectConfig,
  type KritzelObjectElementInfo,
  type KritzelObjectElementPickEvent,
  type KritzelObjectTitlebarConfig,
} from '@kritzel/react-editor';
import { isIframe } from '../agentic-canvas/canvas-agent';
import { GenerativeUiAgent, type PageReference } from './generative-ui-agent';

const WORKSPACE_ID = 'generative-ui';

/** Room in pixels between the reference chip and the chat box below it. */
const CHIP_GAP = 8;

const MAX_TEXT_LENGTH = 32;

/** The page the next prompt changes: the selected iframe object, and the element of it the user picked. */
interface Reference extends PageReference {
  title: string;
}

interface ChipPosition {
  left: number;
  bottom: number;
  width: number;
}

const hostStyle = {
  position: 'relative',
  display: 'block',
  height: '100%',
  // Pages resize from their corners like frames in a design tool, without the white corner squares.
  '--kritzel-selection-resize-handle-visibility': 'hidden',
} as CSSProperties;

const chipStyle: CSSProperties = {
  position: 'absolute',
  zIndex: 3,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  boxSizing: 'border-box',
  maxWidth: '100%',
  height: 32,
  padding: '0 4px 0 10px',
  border: '1px solid #e4e4e7',
  borderRadius: 999,
  background: '#ffffff',
  boxShadow: '0 4px 12px -6px rgba(20, 18, 31, 0.18)',
  color: '#0a0a0a',
  fontFamily: 'system-ui, sans-serif',
  fontSize: 13,
  whiteSpace: 'nowrap',
};

const chipTextStyle: CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis' };
const chipTitleStyle: CSSProperties = { ...chipTextStyle, flexShrink: 0, maxWidth: '45%', fontWeight: 600 };
const chipMutedStyle: CSSProperties = { ...chipTextStyle, color: '#71717a' };

const chipButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: 24,
  height: 24,
  padding: 0,
  border: 0,
  borderRadius: 999,
  background: 'transparent',
  color: '#71717a',
  cursor: 'pointer',
};

/** The pages Claude adds get a titlebar and keep their orientation. */
const objectConfig: KritzelObjectConfig = {
  hasTitlebar: isIframe,
  isRotatable: false,
};

/** The titlebar shows the page's name, which users can rename by clicking it while the page is selected. */
const objectTitlebar: KritzelObjectTitlebarConfig = {
  left: [{ id: 'title', type: 'title', isEditable: true }],
};

/** Short, readable name of a picked element, e.g. `start-button "Start"`. */
function describe(element: KritzelObjectElementInfo): string {
  const name = element.kritzelId ?? element.tagName;
  if (!element.text) {
    return name;
  }
  const text = element.text.length > MAX_TEXT_LENGTH ? `${element.text.slice(0, MAX_TEXT_LENGTH - 1)}…` : element.text;
  return `${name} "${text}"`;
}

function warn(message: string) {
  return (error: unknown) => console.warn(message, error);
}

/**
 * Generative UI with the chat box: a prompt adds a page, and selecting a page lets the user pick one of its elements by
 * hovering over it and clicking. The next prompt then changes the selected page, or just the picked element.
 */
export function GenerativeUiInfographic() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const agentRef = useRef<GenerativeUiAgent | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Mirrors `reference` for the event handlers, which can run before React renders again.
  const referenceRef = useRef<Reference | null>(null);
  const chipObserverRef = useRef<ResizeObserver | null>(null);
  const [reference, setReferenceState] = useState<Reference | null>(null);
  const [chipPosition, setChipPosition] = useState<ChipPosition | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [workspaces] = useState(() => [
    new KritzelWorkspace({ id: WORKSPACE_ID, name: 'Generative UI', objects: [] }),
  ]);

  useEffect(() => () => chipObserverRef.current?.disconnect(), []);

  function setReference(next: Reference | null) {
    referenceRef.current = next;
    setReferenceState(next);
  }

  /** Keeps the reference chip right above the chat box, which grows with its text. */
  function observeChatBox() {
    const editor = editorRef.current;
    const chatBox = editor?.querySelector('kritzel-chat-box');
    if (!editor || !chatBox || chipObserverRef.current) {
      return;
    }
    const update = () => {
      const host = editor.getBoundingClientRect();
      const box = chatBox.getBoundingClientRect();
      setChipPosition({ left: box.left - host.left, bottom: host.bottom - box.top + CHIP_GAP, width: box.width });
    };
    chipObserverRef.current = new ResizeObserver(update);
    chipObserverRef.current.observe(editor);
    chipObserverRef.current.observe(chatBox);
  }

  async function highlightElement(objectId: string, element: KritzelObjectElementInfo) {
    await editorRef.current
      ?.highlightObjectElements(objectId, [{ selector: element.selector, label: element.kritzelId ?? element.tagName }])
      .catch(warn('Could not highlight the picked element.'));
  }

  /** A selected page becomes the reference, and hovering over it highlights the element a click would pick. */
  async function onSelectionChange(objects: KritzelBaseObject[]) {
    const page = objects.length === 1 && isIframe(objects[0]) ? objects[0] : null;
    const previous = referenceRef.current;
    if (page?.id === previous?.objectId) {
      return;
    }

    setReference(page ? { objectId: page.id, title: page.name || page.title } : null);
    const editor = editorRef.current;
    if (previous) {
      // Rejects when the page was deleted, which removed its picking and highlights anyway.
      await editor?.setObjectElementPicking(previous.objectId, false).catch(() => undefined);
      await editor?.clearObjectElementHighlights(previous.objectId).catch(() => undefined);
    }
    if (page) {
      await editor?.setObjectElementPicking(page.id, true).catch(warn('Could not start picking elements.'));
    }
  }

  async function onElementPick({ objectId, element }: KritzelObjectElementPickEvent) {
    const current = referenceRef.current;
    if (current?.objectId !== objectId) {
      return;
    }
    setReference({ ...current, element });
    await highlightElement(objectId, element);
  }

  /** The chip's close button drops the picked element first, then the page. */
  async function onClearReference() {
    const current = referenceRef.current;
    const editor = editorRef.current;
    if (!current || !editor) {
      return;
    }
    if (current.element) {
      setReference({ ...current, element: undefined });
      await editor.clearObjectElementHighlights(current.objectId).catch(warn('Could not clear the highlight.'));
    } else {
      await editor.clearSelection();
    }
  }

  /** Looks the picked element up again after an edit, so the user can keep refining it, or drops it when it is gone. */
  async function refreshElement(objectId: string, selector: string) {
    const current = referenceRef.current;
    if (current?.objectId !== objectId || current.element?.selector !== selector) {
      return;
    }
    const [element] = (await editorRef.current?.queryObjectElements(objectId, selector, 1).catch(() => [])) ?? [];
    if (referenceRef.current !== current) {
      return;
    }
    setReference({ ...current, element });
    if (element) {
      await highlightElement(objectId, element);
    } else {
      await editorRef.current?.clearObjectElementHighlights(objectId).catch(() => undefined);
    }
  }

  async function onChatSubmit(prompt: string) {
    const editor = editorRef.current;
    if (!editor || abortRef.current) {
      return;
    }
    if (!GenerativeUiAgent.hasApiKey) {
      await editor.triggerNotification({
        type: 'warning',
        message: 'Add VITE_ANTHROPIC_API_KEY to the .env file at the repository root and restart the dev server.',
      });
      return;
    }

    agentRef.current ??= new GenerativeUiAgent(editor);
    const current = referenceRef.current;
    const abort = new AbortController();
    abortRef.current = abort;
    setIsWorking(true);

    try {
      await agentRef.current.send(prompt, current && { objectId: current.objectId, element: current.element }, abort.signal);
      if (current?.element) {
        await refreshElement(current.objectId, current.element.selector);
      }
    } catch (error) {
      if (!abort.signal.aborted) {
        console.error(error);
        await editor.triggerNotification({ type: 'error', message: error instanceof Error ? error.message : String(error) });
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
        editorId="infographic-generative-ui"
        workspaces={workspaces}
        activeWorkspaceId={WORKSPACE_ID}
        objectConfig={objectConfig}
        objectTitlebar={objectTitlebar}
        isChatBoxVisible
        isChatBoxLoading={isWorking}
        isWorkspaceManagerVisible={false}
        style={{ display: 'block', height: '100%' }}
        onIsReady={observeChatBox}
        onObjectsSelectionChange={event => void onSelectionChange(event.detail)}
        onObjectElementPick={event => void onElementPick(event.detail)}
        onChatSubmit={event => void onChatSubmit(event.detail)}
        onChatStop={() => abortRef.current?.abort()}
      />
      {reference && chipPosition && (
        <div
          role="status"
          aria-label="Prompt reference"
          style={{ ...chipStyle, left: chipPosition.left, bottom: chipPosition.bottom, maxWidth: chipPosition.width }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4a7dff" strokeWidth="2.2" aria-hidden="true">
            <path d="M4 4l6.5 16 2.4-6.6L19.5 11z" strokeLinejoin="round" />
          </svg>
          <span style={chipTitleStyle}>{reference.title}</span>
          {reference.element ? (
            <>
              <span style={chipMutedStyle} aria-hidden="true">›</span>
              <span style={chipTextStyle}>{describe(reference.element)}</span>
            </>
          ) : (
            <span style={chipMutedStyle}>Hover over the page and click to pick an element</span>
          )}
          <button
            type="button"
            aria-label={reference.element ? 'Remove the picked element' : 'Deselect the page'}
            title={reference.element ? 'Remove the picked element' : 'Deselect the page'}
            style={chipButtonStyle}
            onClick={() => void onClearReference()}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
