import { useRef, useState, type CSSProperties } from "react";
import {
  darkTheme,
  KritzelBrushTool,
  KritzelEditor,
  KritzelImage,
  KritzelTextTool,
  type HTMLKritzelEditorElement,
  type KritzelTheme,
} from "kritzel-react";
import { customReactTheme } from "../../../const/custom-react-theme";

type AnnotationMode = "sketch" | "text";

type ColorTool = {
  name: string;
  label: string;
  color: string;
};

const annotationThemeDark: KritzelTheme = {
  ...darkTheme,
  name: "annotation-theme-dark",
  engine: {
    ...darkTheme.engine,
    backgroundColor: "#090f18",
    loadingOverlayBackground: "rgba(9, 15, 24, 0.72)",
  },
};

const themes = [annotationThemeDark, customReactTheme, darkTheme];

const colorTools: ColorTool[] = [
  { name: "ink-black", label: "Black", color: "#030712" },
  { name: "ink-red", label: "Red", color: "#f15f54" },
  { name: "ink-yellow", label: "Yellow", color: "#eab308" },
  { name: "ink-green", label: "Green", color: "#4ade80" },
  { name: "ink-cyan", label: "Cyan", color: "#38bdf8" },
  { name: "ink-violet", label: "Violet", color: "#c084fc" },
  { name: "ink-gray", label: "Gray", color: "#d1d5db" },
];

const hostStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  height: "100%",
  overflow: "hidden",
  color: "#eef2ff",
  background:
    "radial-gradient(circle at 15% 20%, rgba(251, 146, 60, 0.14), transparent 40%), radial-gradient(circle at 85% 78%, rgba(59, 130, 246, 0.16), transparent 38%), linear-gradient(120deg, #0d111a 0%, #181c2a 52%, #0f1724 100%)",
  fontFamily: "Inter, Segoe UI, sans-serif",
};

const editorStyle: CSSProperties = {
  display: "block",
  width: "100%",
  height: "100%",
};

const actionBarStyle: CSSProperties = {
  position: "absolute",
  top: "16px",
  right: "16px",
  zIndex: 24,
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const zoomBarStyle: CSSProperties = {
  position: "absolute",
  left: "16px",
  bottom: "16px",
  zIndex: 24,
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const toolDockStyle: CSSProperties = {
  position: "absolute",
  left: "50%",
  bottom: "18px",
  transform: "translateX(-50%)",
  zIndex: 20,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "12px",
};

const swatchRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(11, 16, 27, 0.84)",
  border: "1px solid rgba(255, 255, 255, 0.15)",
  boxShadow: "0 12px 32px rgba(0, 0, 0, 0.35)",
};

const modeRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "6px",
  borderRadius: "999px",
  background: "rgba(11, 16, 27, 0.84)",
  border: "1px solid rgba(255, 255, 255, 0.15)",
  boxShadow: "0 12px 32px rgba(0, 0, 0, 0.35)",
};

const actionButtonStyle: CSSProperties = {
  height: "34px",
  padding: "0 14px",
  borderRadius: "999px",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  background: "rgba(10, 16, 28, 0.78)",
  color: "#e2e8f0",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 120ms ease",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.28)",
};

const iconButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  width: "34px",
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const primaryButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  background: "rgba(8, 126, 164, 0.92)",
  borderColor: "rgba(255, 255, 255, 0.35)",
  color: "#ffffff",
};

function swatchButtonStyle(active: boolean, color: string): CSSProperties {
  return {
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    border: active ? "2px solid #ffffff" : "2px solid rgba(255, 255, 255, 0.22)",
    background: color,
    cursor: "pointer",
    transition: "transform 120ms ease",
    boxShadow: active
      ? "0 0 0 2px rgba(255, 255, 255, 0.25), 0 0 0 6px rgba(255, 255, 255, 0.07)"
      : "none",
  };
}

function modeButtonStyle(active: boolean): CSSProperties {
  return {
    minWidth: "96px",
    padding: "10px 14px",
    border: "none",
    borderRadius: "999px",
    background: active ? "#ffffff" : "rgba(255, 255, 255, 0.08)",
    color: active ? "#0f172a" : "#dbeafe",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 120ms ease",
  };
}

const UndoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
  </svg>
);

const RedoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 14 5-5-5-5" />
    <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13" />
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

const MinusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
  </svg>
);

export function ImageAnnotationStudioPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [activeMode, setActiveMode] = useState<AnnotationMode>("sketch");
  const [activeSketchTool, setActiveSketchTool] = useState<string>("ink-red");

  async function registerColorTools(editor: HTMLKritzelEditorElement) {
    for (const tool of colorTools) {
      await editor.registerTool(tool.name, KritzelBrushTool, {
        type: "pen",
        color: { light: tool.color, dark: tool.color },
        size: 5,
        palettes: {
          pen: [{ light: tool.color, dark: tool.color, label: tool.label }],
        },
      });
    }
  }

  async function syncTextColorToActiveSketchTool(sketchToolName: string) {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const activeSketchColor =
      colorTools.find((tool) => tool.name === sketchToolName)?.color ??
      colorTools[0].color;

    const textColor = { light: activeSketchColor, dark: activeSketchColor };

    // registerTool updates existing tools in-place, which lets us keep text color
    // aligned with the currently selected sketch swatch.
    const textToolConfig = {
      fontColor: textColor,
    } as unknown as Parameters<HTMLKritzelEditorElement["registerTool"]>[2];

    await editor.registerTool("text", KritzelTextTool, textToolConfig);
  }

  async function ensureSeedImage(editor: HTMLKritzelEditorElement) {
    const image = await KritzelImage.fromUrl(
      "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=1800&q=80",
      { maxWidth: 660, maxHeight: 360 },
    );

    image.translateX = -image.width / 2;
    image.translateY = -image.height / 2 - 50;

    await editor.addObject(image);
  }

  async function activateColorTool(toolName: string) {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    setActiveSketchTool(toolName);
    setActiveMode("sketch");
    await syncTextColorToActiveSketchTool(toolName);
    await editor.changeActiveToolByName(toolName);
  }

  async function activateMode(mode: AnnotationMode) {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    setActiveMode(mode);

    if (mode === "text") {
      await syncTextColorToActiveSketchTool(activeSketchTool);
      await editor.changeActiveToolByName("text");
      return;
    }

    await editor.changeActiveToolByName(activeSketchTool);
  }

  async function onReady() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    await registerColorTools(editor);
    await ensureSeedImage(editor);
    await activateColorTool(activeSketchTool);
  }

  async function undo() {
    await editorRef.current?.undo();
  }

  async function redo() {
    await editorRef.current?.redo();
  }

  async function zoomIn() {
    await editorRef.current?.zoomIn();
  }

  async function zoomOut() {
    await editorRef.current?.zoomOut();
  }

  async function download() {
    await editorRef.current?.exportViewportAsPng({ includeBackground: false });
  }

  return (
    <div style={hostStyle}>
      <KritzelEditor
        ref={editorRef}
        editorId="image-annotation-studio"
        theme="annotation-theme-dark"
        themes={themes}
        scaleMax={10}
        scaleMin={0.1}
        wheelEnabled={false}
        isControlsVisible={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        isUtilityPanelVisible={false}
        onIsReady={() => {
          void onReady();
        }}
        style={editorStyle}
      />

      <div style={actionBarStyle}>
        <button style={iconButtonStyle} type="button" aria-label="Undo" onClick={() => void undo()}>
          <UndoIcon />
        </button>
        <button style={iconButtonStyle} type="button" aria-label="Redo" onClick={() => void redo()}>
          <RedoIcon />
        </button>
        <button style={primaryButtonStyle} type="button" onClick={() => void download()}>
          Download
        </button>
      </div>

      <div style={zoomBarStyle} aria-label="Zoom controls">
        <button style={iconButtonStyle} type="button" aria-label="Zoom out" onClick={() => void zoomOut()}>
          <MinusIcon />
        </button>
        <button style={iconButtonStyle} type="button" aria-label="Zoom in" onClick={() => void zoomIn()}>
          <PlusIcon />
        </button>
      </div>

      <div style={toolDockStyle}>
        <div style={swatchRowStyle}>
          {colorTools.map((tool) => (
            <button
              key={tool.name}
              style={swatchButtonStyle(activeSketchTool === tool.name, tool.color)}
              onClick={() => void activateColorTool(tool.name)}
              aria-label={`Activate ${tool.label} sketch tool`}
              type="button"
            />
          ))}
        </div>

        <div style={modeRowStyle} role="tablist" aria-label="Annotation mode">
          <button style={modeButtonStyle(activeMode === "sketch")} onClick={() => void activateMode("sketch")} type="button">
            Sketch
          </button>
          <button style={modeButtonStyle(activeMode === "text")} onClick={() => void activateMode("text")} type="button">
            Text
          </button>
        </div>
      </div>
    </div>
  );
}
