import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { KritzelEditor, KritzelIframeObject, KritzelWorkspace } from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { mockChatPrompts, mockComponentDefinitions } from "./iframe-calculator-definitions";

const chatInputStyle: CSSProperties = { position: "absolute", left: "50%", bottom: 18, zIndex: 20, display: "block", width: "min(460px, calc(100% - 32px))", padding: 10, border: "1px solid #e5e7eb", borderRadius: 16, background: "#ffffff", boxShadow: "0 16px 42px rgba(32, 33, 36, 0.18)", boxSizing: "border-box", transform: "translateX(-50%)", fontFamily: "Roboto, sans-serif" };
const textareaStyle: CSSProperties = { display: "block", width: "100%", height: 98, minHeight: 98, maxHeight: 98, resize: "none", border: 0, borderRadius: 12, padding: "12px 14px 38px 14px", boxSizing: "border-box", background: "#f3f4f6", color: "#202124", font: "inherit", lineHeight: 1.45, outline: 0, boxShadow: "none" };
const queryNavStyle: CSSProperties = { position: "absolute", right: 8, bottom: 8, display: "flex", alignItems: "center", gap: 6, color: "#5f6368", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", userSelect: "none" };
const navButtonStyle: CSSProperties = { width: 26, height: 26, border: 0, borderRadius: 999, padding: 0, background: "#ffffff", color: "#202124", cursor: "pointer", font: "inherit", fontSize: 18, lineHeight: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(32, 33, 36, 0.12)" };
const navButtonDisabledStyle: CSSProperties = { color: "#b8bdc4", cursor: "default", opacity: 0.55, boxShadow: "none" };

function NavButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: ReactNode }) {
  const [isHovered, setIsHovered] = useState(false);
  const style = { ...navButtonStyle, ...(disabled ? navButtonDisabledStyle : isHovered ? { background: "#e5e7eb" } : {}) };

  return (
    <button type="button" aria-label={label} disabled={disabled} onClick={onClick} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} style={style}>
      {children}
    </button>
  );
}

function createRuntimeObject(): KritzelIframeObject {
  const definition = mockComponentDefinitions[0];
  const object = new KritzelIframeObject({
    content: definition.content,
    loadingContent: definition.loadingContent,
    state: definition.initialState,
    title: definition.name,
    translateX: -140,
    translateY: -200,
    width: 280,
    height: 320,
    borderRadius: 12,
    boxShadow: "0 12px 32px rgba(32, 33, 36, 0.12)",
  });
  object.isRotatable = false;
  return object;
}

export function DynamicObjectsIframePage() {
  const runtimeObject = useMemo(() => createRuntimeObject(), []);
  const workspaces = useMemo(() => [new KritzelWorkspace({ objects: [runtimeObject] })], [runtimeObject]);
  const [promptIndex, setPromptIndex] = useState(0);
  const [promptText, setPromptText] = useState(mockChatPrompts[0]);
  const responseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (responseTimeout.current) clearTimeout(responseTimeout.current);
  }, []);

  function showPrompt(offset: -1 | 1) {
    const nextIndex = Math.max(0, Math.min(promptIndex + offset, mockChatPrompts.length - 1));
    if (nextIndex === promptIndex) return;

    if (responseTimeout.current) clearTimeout(responseTimeout.current);
    setPromptIndex(nextIndex);
    setPromptText(mockChatPrompts[nextIndex]);
    const definition = mockComponentDefinitions[nextIndex];
    runtimeObject.setLoadingContent(definition.loadingContent);
    runtimeObject.setContent(definition.loadingContent);
    runtimeObject.setLoading(true);
    responseTimeout.current = setTimeout(() => {
      runtimeObject.setState(definition.initialState);
      runtimeObject.setContent(definition.content);
      runtimeObject.setLoading(false);
      responseTimeout.current = null;
    }, 1100);
  }

  return (
    <div style={{ position: "relative", height: "100%" }}>
      <KritzelEditor
        editorId="dynamic-objects-iframe"
        theme="light"
        themes={[reactThemeLight, reactThemeDark]}
        workspaces={workspaces}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isToolbarVisible={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
      <div style={chatInputStyle}>
        <div style={{ position: "relative", width: "100%" }}>
          <textarea rows={3} aria-label="Mock LLM prompt" value={promptText} onChange={(event) => setPromptText(event.target.value)} style={textareaStyle} />
          <div aria-label="Mock prompt navigation" style={queryNavStyle}>
            <NavButton label="Previous query" disabled={promptIndex === 0} onClick={() => showPrompt(-1)}>‹</NavButton>
            <span>{promptIndex + 1} of {mockChatPrompts.length}</span>
            <NavButton label="Next query" disabled={promptIndex === mockChatPrompts.length - 1} onClick={() => showPrompt(1)}>›</NavButton>
          </div>
        </div>
      </div>
    </div>
  );
}