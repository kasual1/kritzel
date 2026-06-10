import { useRef, useState } from "react";
import {
  KritzelEditor,
  type HTMLKritzelEditorElement,
} from "kritzel-react";
import { customReactTheme } from "../../../const/custom-react-theme";
import {
  buttonStyle,
  editorStyle,
  hostStyle,
  seedEditor,
  statusBarStyle,
  toolbarStyle,
} from "../shared/concept-shared";

type ToolName = "select" | "brush" | "eraser" | "line" | "shape" | "text";

const tools: Array<{ name: ToolName; label: string }> = [
  { name: "select", label: "Select" },
  { name: "brush", label: "Brush" },
  { name: "eraser", label: "Eraser" },
  { name: "line", label: "Line" },
  { name: "shape", label: "Shape" },
  { name: "text", label: "Text" },
];

export function ToolsChangePage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [activeTool, setActiveTool] = useState<ToolName>("select");

  async function setTool(name: ToolName) {
    setActiveTool(name);
    await editorRef.current?.changeActiveToolByName(name);
  }

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        {tools.map((tool) => (
          <button key={tool.name} style={buttonStyle(activeTool === tool.name)} onClick={() => void setTool(tool.name)}>
            {tool.label}
          </button>
        ))}
      </div>
      <KritzelEditor
        ref={editorRef}
        editorId="tools-change"
        wheelEnabled={false}
        theme="react-theme"
        themes={[customReactTheme]}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        isControlsVisible={false}
        onIsReady={() => {
          if (editorRef.current) {
            void seedEditor(editorRef.current);
          }
        }}
        style={editorStyle}
      />
      <div style={statusBarStyle}>
        Active tool: <strong>{activeTool}</strong>
      </div>
    </div>
  );
}
