import { useEffect, useMemo, useRef, useState } from "react";
import { KritzelEditor, KritzelIframeObject, KritzelWorkspace } from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { mockChatPrompts, mockComponentDefinitions } from "./iframe-calculator-definitions";

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
      <div style={{ position: "absolute", left: "50%", bottom: 18, zIndex: 20, width: "min(460px, calc(100% - 32px))", padding: 10, border: "1px solid #e5e7eb", borderRadius: 16, background: "#fff", boxShadow: "0 16px 42px rgba(32,33,36,.18)", boxSizing: "border-box", transform: "translateX(-50%)", fontFamily: "Roboto, sans-serif" }}>
        <textarea rows={3} aria-label="Mock LLM prompt" value={promptText} onChange={(event) => setPromptText(event.target.value)} style={{ display: "block", width: "100%", height: 98, resize: "none", border: 0, borderRadius: 12, padding: "12px 14px 38px", boxSizing: "border-box", background: "#f3f4f6", font: "inherit", lineHeight: 1.45 }} />
        <div aria-label="Mock prompt navigation" style={{ position: "absolute", right: 18, bottom: 18, display: "flex", alignItems: "center", gap: 6, color: "#5f6368", fontSize: 12, fontWeight: 700 }}>
          <button type="button" aria-label="Previous query" disabled={promptIndex === 0} onClick={() => showPrompt(-1)}>‹</button>
          <span>{promptIndex + 1} of {mockChatPrompts.length}</span>
          <button type="button" aria-label="Next query" disabled={promptIndex === mockChatPrompts.length - 1} onClick={() => showPrompt(1)}>›</button>
        </div>
      </div>
    </div>
  );
}