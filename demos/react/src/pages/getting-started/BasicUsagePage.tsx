import { useRef, useState } from "react";
import {
  InMemorySyncProvider,
  KritzelBaseObject,
  KritzelEditor,
  KritzelSyncConfig,
  KritzelText,
  KritzelWorkspace,
} from "@kritzel/react-editor";
import { reactThemeDark } from "../../const/react-theme-dark";
import { reactThemeLight } from "../../const/react-theme-light";
import { createSeedObjects } from "./seed-objects";

type ToolName = "brush" | "selection";

const syncConfig: KritzelSyncConfig = {
  providers: [InMemorySyncProvider],
};
const themes = [reactThemeLight, reactThemeDark];
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })];

export function BasicUsagePage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolName>("selection");
  const [objectsCount, setObjectsCount] = useState(0);

  const statusLine = isReady
    ? `Objects: ${objectsCount} | Tool: ${activeTool}`
    : "Loading editor...";

  function onReady() {
    setIsReady(true);
  }

  function onObjectsChange(
    event: CustomEvent<KritzelBaseObject<HTMLElement | SVGElement>[]>,
  ) {
    setObjectsCount(event.detail.length);
  }

  async function setBrushTool() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    setActiveTool("brush");
    await editor.setActiveTool("brush");
  }

  async function setSelectTool() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    setActiveTool("selection");
    await editor.setActiveTool("selection");
  }

  async function addText() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const text = new KritzelText({
      text: "Programmatic text!",
      translateX: 0,
      translateY: 0,
      fontSize: 24,
      fontFamily: "Arial",
      fontColor: { light: "#ff0000", dark: "#ff4d6d" },
    });

    await editor.addObject(text);
    await editor.selectObjects([text]);
  }

  async function undoAction() {
    await editorRef.current?.undo();
  }

  async function zoomIn() {
    await editorRef.current?.zoomIn();
  }

  async function zoomOut() {
    await editorRef.current?.zoomOut();
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        fontFamily: "Roboto, sans-serif",
        background: "#fafafa",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "wrap",
          padding: "8px 12px",
          borderBottom: "1px solid #ebebeb",
          background: "#f5f5f5",
        }}
      >
        <button
          style={buttonStyle(activeTool === "brush")}
          onClick={() => void setBrushTool()}
        >
          Brush
        </button>
        <button
          style={buttonStyle(activeTool === "selection")}
          onClick={() => void setSelectTool()}
        >
          Select
        </button>
        <button style={buttonStyle(false)} onClick={() => void addText()}>
          Add Text
        </button>
        <button style={buttonStyle(false)} onClick={() => void undoAction()}>
          Undo
        </button>
        <button style={buttonStyle(false)} onClick={() => void zoomIn()}>
          Zoom In
        </button>
        <button style={buttonStyle(false)} onClick={() => void zoomOut()}>
          Zoom Out
        </button>
        <span
          style={{
            marginLeft: "auto",
            fontSize: "12px",
            color: "#555555",
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          {statusLine}
        </span>
      </header>

      <KritzelEditor
        ref={editorRef}
        editorId="basic-usage"
        syncConfig={syncConfig}
        workspaces={workspaces}
        theme="light"
        themes={themes}
        loginConfig={undefined}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        isToolbarVisible={false}
        onIsReady={onReady}
        onObjectsChange={onObjectsChange}
        style={{ flex: 1, minHeight: 0, display: "block" }}
      />
    </div>
  );
}

function buttonStyle(active: boolean): React.CSSProperties {
  return {
    padding: "6px 12px",
    border: `1px solid ${active ? "#087ea4" : "#d9d9d9"}`,
    borderRadius: "6px",
    background: active ? "#087ea4" : "#ffffff",
    color: active ? "#ffffff" : "#333333",
    fontSize: "13px",
    cursor: "pointer",
    fontFamily: "inherit",
  };
}
