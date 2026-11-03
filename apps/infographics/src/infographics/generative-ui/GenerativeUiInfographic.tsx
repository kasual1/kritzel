import { useRef, useState, type CSSProperties } from 'react';
import {
  KritzelEditor,
  KritzelWorkspace,
  type HTMLKritzelEditorElement,
  type KritzelBaseObject,
  type KritzelChatBoxChip,
  type KritzelObjectConfig,
  type KritzelObjectElementInfo,
  type KritzelObjectElementPickEvent,
  type KritzelObjectTitlebarConfig,
} from '@kritzel/react-editor';
import { isIframe } from '../agentic-canvas/canvas-agent';
import { GenerativeUiAgent, revealPage, type PageReference } from './generative-ui-agent';
import { createMusicPlayer } from './music-player';

const WORKSPACE_ID = 'generative-ui';

/**
 * Pointing into an inline SVG icon picks the whole icon instead of one of its paths, and an icon inside a button or
 * link picks the button or link.
 */
const PICKABLE_SELECTOR = ':not(svg *):not(button svg):not(a svg)';

/** The page the next prompt changes: the selected iframe object, and the element of it the user picked. */
interface Reference extends PageReference {
  title: string;
}

const hostStyle = {
  position: 'relative',
  display: 'block',
  height: '100%',
  // Pages resize from their corners like frames in a design tool, without the white corner squares.
  '--kritzel-selection-resize-handle-visibility': 'hidden',
} as CSSProperties;

/** The pages Claude adds get a titlebar and keep their orientation. */
const objectConfig: KritzelObjectConfig = {
  hasTitlebar: isIframe,
  isRotatable: false,
};

/** The titlebar shows the page's name, which users can rename by clicking it while the page is selected. */
const objectTitlebar: KritzelObjectTitlebarConfig = {
  left: [{ id: 'title', type: 'title', isEditable: true }],
};

/** Name of a picked element for the chat box chip and its highlight, e.g. `play-button`. Its text is left out. */
function getElementName(element: KritzelObjectElementInfo): string {
  return element.kritzelId ?? element.tagName;
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
  const [reference, setReferenceState] = useState<Reference | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [musicPlayer] = useState(createMusicPlayer);
  const [workspaces] = useState(() => [
    new KritzelWorkspace({ id: WORKSPACE_ID, name: 'Generative UI', objects: [musicPlayer] }),
  ]);

  function setReference(next: Reference | null) {
    referenceRef.current = next;
    setReferenceState(next);
  }

  async function onReady() {
    const editor = editorRef.current;
    const page = await editor?.getObjectById(musicPlayer.id);
    if (editor && page && isIframe(page)) {
      await revealPage(editor, page);
    }
  }

  async function highlightElement(objectId: string, element: KritzelObjectElementInfo) {
    await editorRef.current
      ?.highlightObjectElements(objectId, [{ selector: element.selector, label: getElementName(element) }])
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
      await editor
        ?.setObjectElementPicking(page.id, true, { selector: PICKABLE_SELECTOR })
        .catch(warn('Could not start picking elements.'));
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

  /** The chat box chip's remove button drops the picked element first, then the page. */
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
        message: 'Add ANTHROPIC_API_KEY to the .env file at the repository root and restart the dev server.',
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

  /** The chip above the chat box names what the next prompt changes: the selected page, or the element picked in it. */
  const chatBoxChips: KritzelChatBoxChip[] = reference
    ? [
        {
          id: reference.objectId,
          label: reference.title,
          icon: 'cursor',
          detail: reference.element ? getElementName(reference.element) : undefined,
          hint: reference.element ? undefined : 'Hover over the page and click to pick an element',
        },
      ]
    : [];

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
        chatBoxChips={chatBoxChips}
        isWorkspaceManagerVisible={false}
        style={{ display: 'block', height: '100%' }}
        onIsReady={() => void onReady()}
        onObjectsSelectionChange={event => void onSelectionChange(event.detail)}
        onObjectElementPick={event => void onElementPick(event.detail)}
        onChatSubmit={event => void onChatSubmit(event.detail)}
        onChatStop={() => abortRef.current?.abort()}
        onChatChipRemove={() => void onClearReference()}
      />
    </div>
  );
}
