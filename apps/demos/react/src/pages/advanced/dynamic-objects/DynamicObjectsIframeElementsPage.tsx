import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  KritzelEditor,
  KritzelIframeObject,
  KritzelWorkspace,
  type HTMLKritzelEditorElement,
  type KritzelObjectElementInfo,
  type KritzelObjectElementPickEvent,
} from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { iframeElementsContent } from "./iframe-elements-content";

const AGENT = "agent";
const EMPTY = "—";
const MAX_TEXT_LENGTH = 24;
// The panel is docked to the bottom-left corner and the card sits above it, so they don't overlap even in the
// 560px high docs embed. The agent starts just right of the card's top edge.
const CARD_TOP = -250;
const AGENT_START = { x: 170, y: CARD_TOP + 10 };

const panelStyle: CSSProperties = { position: "absolute", left: 16, bottom: 16, zIndex: 20, display: "flex", flexDirection: "column", gap: 8, width: "min(280px, calc(100% - 32px))", padding: 12, border: "1px solid #e5e7eb", borderRadius: 12, background: "#ffffff", boxShadow: "0 8px 24px rgba(32, 33, 36, 0.12)", boxSizing: "border-box", color: "#202124", fontFamily: "Roboto, system-ui, sans-serif", fontSize: 13, lineHeight: 1.4 };
const hintStyle: CSSProperties = { margin: 0, color: "#5f6368" };
const rowsStyle: CSSProperties = { display: "grid", gridTemplateColumns: "64px minmax(0, 1fr)", columnGap: 8, rowGap: 4, margin: 0 };
const labelStyle: CSSProperties = { margin: 0, color: "#5f6368" };
const valueStyle: CSSProperties = { margin: 0, overflow: "hidden", fontWeight: 600, textOverflow: "ellipsis", whiteSpace: "nowrap" };
const actionsStyle: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 6 };
const buttonStyle: CSSProperties = { flex: "1 1 auto", height: 28, padding: "0 10px", border: "1px solid #dadce0", borderRadius: 8, background: "#ffffff", color: "#202124", cursor: "pointer", font: "inherit", fontWeight: 600 };
const toggleButtonStyle: CSSProperties = { ...buttonStyle, flexBasis: "100%" };
const activeButtonStyle: CSSProperties = { borderColor: "#4a7dff", background: "#4a7dff", color: "#ffffff" };

/** Short, readable description of an element inside the iframe, e.g. `checkout "Checkout"`. */
function describe(element: KritzelObjectElementInfo): string {
  const name = element.kritzelId ?? element.tagName;
  if (!element.text) return name;
  const text = element.text.length > MAX_TEXT_LENGTH ? `${element.text.slice(0, MAX_TEXT_LENGTH - 1)}…` : element.text;
  return `${name} "${text}"`;
}

function createPlanObject(): KritzelIframeObject {
  const object = new KritzelIframeObject({
    name: "Team plan",
    title: "Team plan",
    content: iframeElementsContent,
    translateX: -150,
    translateY: CARD_TOP,
    width: 300,
    height: 290,
    borderRadius: 12,
    boxShadow: "0 12px 32px rgba(32, 33, 36, 0.12)",
  });
  object.isRotatable = false;
  return object;
}

function Row({ label, testId, children }: { label: string; testId: string; children: ReactNode }) {
  return (
    <>
      <dt style={labelStyle}>{label}</dt>
      <dd data-testid={testId} style={valueStyle}>{children}</dd>
    </>
  );
}

export function DynamicObjectsIframeElementsPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const planObject = useMemo(() => createPlanObject(), []);
  const workspaces = useMemo(() => [new KritzelWorkspace({ objects: [planObject] })], [planObject]);
  const [hovered, setHovered] = useState(EMPTY);
  const [clicked, setClicked] = useState(EMPTY);
  const [picked, setPicked] = useState(EMPTY);
  const [isPicking, setIsPicking] = useState(false);

  async function handleReady() {
    const editor = editorRef.current;
    if (!editor) return;

    try {
      // Hover reporting and picking only work while the iframe object is selected (interactive).
      await editor.selectObjects([planObject]);
      if (!(await editor.getAgenticCursor(AGENT))) {
        await editor.addAgenticCursor({ id: AGENT, name: "Agent", status: "Pick an element", position: AGENT_START });
      }
    } catch (error) {
      console.warn("Could not prepare the iframe element demo.", error);
    }
  }

  async function setPicking(enabled: boolean) {
    const editor = editorRef.current;
    if (!editor) return;

    setIsPicking(enabled);
    try {
      await editor.setObjectElementPicking(planObject.id, enabled);
    } catch (error) {
      setIsPicking(false);
      console.warn("Could not change element picking.", error);
    }
  }

  async function highlightButtons() {
    try {
      await editorRef.current?.highlightObjectElements(planObject.id, [{ selector: "button" }]);
    } catch (error) {
      console.warn("Could not highlight the buttons.", error);
    }
  }

  async function clearHighlights() {
    try {
      await editorRef.current?.clearObjectElementHighlights(planObject.id);
    } catch (error) {
      console.warn("Could not clear the highlights.", error);
    }
  }

  async function handlePick({ objectId, element }: KritzelObjectElementPickEvent) {
    setPicked(describe(element));
    setIsPicking(false);
    const editor = editorRef.current;
    if (!editor) return;

    try {
      await editor.setObjectElementPicking(objectId, false);
      await editor.highlightObjectElements(objectId, [{ selector: element.selector, label: "Picked" }]);
      await editor.updateAgenticCursor(AGENT, { status: `Looking at ${element.kritzelId ?? element.tagName}` });
      await editor.moveAgenticCursor(AGENT, { objectId, selector: element.selector });
    } catch (error) {
      console.warn("Could not point the agent at the picked element.", error);
    }
  }

  return (
    <div style={{ position: "relative", height: "100%" }}>
      <KritzelEditor
        ref={editorRef}
        editorId="dynamic-objects-iframe-elements"
        theme="light"
        themes={[reactThemeLight, reactThemeDark]}
        workspaces={workspaces}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isToolbarVisible={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        isZoomPanelVisible={false}
        onIsReady={() => void handleReady()}
        onObjectElementHover={event => setHovered(event.detail.element ? describe(event.detail.element) : EMPTY)}
        onObjectElementClick={event => setClicked(describe(event.detail.element))}
        onObjectElementPick={event => void handlePick(event.detail)}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
      <section aria-label="Iframe element events" style={panelStyle}>
        <p style={hintStyle}>Select the card, then hover, click or pick an element.</p>
        <dl style={rowsStyle}>
          <Row label="Hovered" testId="hovered-element">{hovered}</Row>
          <Row label="Clicked" testId="clicked-element">{clicked}</Row>
          <Row label="Picked" testId="picked-element">{picked}</Row>
        </dl>
        <div style={actionsStyle}>
          <button type="button" data-testid="toggle-picking" aria-pressed={isPicking} onClick={() => void setPicking(!isPicking)} style={isPicking ? { ...toggleButtonStyle, ...activeButtonStyle } : toggleButtonStyle}>
            {isPicking ? "Stop picking" : "Pick element"}
          </button>
          <button type="button" data-testid="highlight-controls" onClick={() => void highlightButtons()} style={buttonStyle}>Highlight buttons</button>
          <button type="button" data-testid="clear-highlights" onClick={() => void clearHighlights()} style={buttonStyle}>Clear</button>
        </div>
      </section>
    </div>
  );
}
