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
import { GenerativeUiAgent, isIframe, revealPage, type PageReference } from './generative-ui-agent';
import { createMusicPlayer } from './music-player';

const WORKSPACE_ID = 'generative-ui';

/**
 * Pointing into an inline SVG icon picks the whole icon instead of one of its paths, and an icon inside a button or
 * link picks the button or link.
 */
const PICKABLE_SELECTOR = ':not(svg *):not(button svg):not(a svg)';

/** The page the next prompt changes: the selected iframe object, and the elements of it the user picked. */
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

/** Chips of picked elements get this id prefix, so they can't be confused with the page chip. */
const ELEMENT_CHIP_PREFIX = 'element:';

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

  /** Highlights every picked element; each call replaces the page's previous highlights. */
  async function highlightElements(objectId: string, elements: KritzelObjectElementInfo[]) {
    const editor = editorRef.current;
    if (!elements.length) {
      await editor?.clearObjectElementHighlights(objectId).catch(() => undefined);
      return;
    }
    await editor
      ?.highlightObjectElements(objectId, elements.map(element => ({ selector: element.selector, label: getElementName(element) })))
      .catch(warn('Could not highlight the picked elements.'));
  }

  /** A selected page becomes the reference, and hovering over it highlights the element a click would pick. */
  async function onSelectionChange(objects: KritzelBaseObject[]) {
    const page = objects.length === 1 && isIframe(objects[0]) ? objects[0] : null;
    const previous = referenceRef.current;
    if (page?.id === previous?.objectId) {
      return;
    }

    setReference(page ? { objectId: page.id, title: page.name || page.title, elements: [] } : null);
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

  /** A plain pick replaces the picked elements; with Cmd, Ctrl or Shift held, it adds the element or removes it again. */
  async function onElementPick({ objectId, element, metaKey, ctrlKey, shiftKey }: KritzelObjectElementPickEvent) {
    const current = referenceRef.current;
    if (current?.objectId !== objectId) {
      return;
    }
    const isPicked = current.elements.some(picked => picked.selector === element.selector);
    let elements = [element];
    if (metaKey || ctrlKey || shiftKey) {
      elements = isPicked
        ? current.elements.filter(picked => picked.selector !== element.selector)
        : [...current.elements, element];
    }
    setReference({ ...current, elements });
    await highlightElements(objectId, elements);
  }

  /** An element chip's remove button drops that element; the page chip's deselects the page. */
  async function onChipRemove(chip: KritzelChatBoxChip) {
    const current = referenceRef.current;
    const editor = editorRef.current;
    if (!current || !editor) {
      return;
    }
    if (!chip.id.startsWith(ELEMENT_CHIP_PREFIX)) {
      await editor.clearSelection();
      return;
    }
    const selector = chip.id.slice(ELEMENT_CHIP_PREFIX.length);
    const elements = current.elements.filter(element => element.selector !== selector);
    setReference({ ...current, elements });
    await highlightElements(current.objectId, elements);
  }

  /** Looks the picked elements up again after an edit, so the user can keep refining them, and drops those that are gone. */
  async function refreshElements(objectId: string, picked: KritzelObjectElementInfo[]) {
    const current = referenceRef.current;
    if (current?.objectId !== objectId || current.elements !== picked) {
      return;
    }
    const found = await Promise.all(
      picked.map(async element => {
        const [match] = (await editorRef.current?.queryObjectElements(objectId, element.selector, 1).catch(() => [])) ?? [];
        return match;
      }),
    );
    if (referenceRef.current !== current) {
      return;
    }
    const elements = found.filter((element): element is KritzelObjectElementInfo => !!element);
    setReference({ ...current, elements });
    await highlightElements(objectId, elements);
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
      await agentRef.current.send(prompt, current && { objectId: current.objectId, elements: current.elements }, abort.signal);
      if (current?.elements.length) {
        await refreshElements(current.objectId, current.elements);
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

  /** The chips above the chat box name what the next prompt changes: the selected page, or each element picked in it. */
  let chatBoxChips: KritzelChatBoxChip[] = [];
  if (reference && reference.elements.length) {
    chatBoxChips = reference.elements.map(element => ({
      id: ELEMENT_CHIP_PREFIX + element.selector,
      label: reference.title,
      icon: 'cursor',
      detail: getElementName(element),
    }));
  } else if (reference) {
    chatBoxChips = [
      {
        id: reference.objectId,
        label: reference.title,
        icon: 'cursor',
        hint: 'Click an element to pick it, Shift-click for more',
      },
    ];
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
        chatBoxChips={chatBoxChips}
        isWorkspaceManagerVisible={false}
        style={{ display: 'block', height: '100%' }}
        onIsReady={() => void onReady()}
        onObjectsSelectionChange={event => void onSelectionChange(event.detail)}
        onObjectElementPick={event => void onElementPick(event.detail)}
        onChatSubmit={event => void onChatSubmit(event.detail)}
        onChatStop={() => abortRef.current?.abort()}
        onChatChipRemove={event => void onChipRemove(event.detail)}
      />
    </div>
  );
}
