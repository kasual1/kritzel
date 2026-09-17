import { useRef, useState } from "react";
import {
  KritzelBrushTool,
  KritzelEditor,
  KritzelEraserTool,
  KritzelSelectionTool,
  HTMLKritzelEditorElement,
  type KritzelToolbarItem,
} from "@kritzel/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";
import {
  buttonStyle,
  editorStyle,
  hostStyle,
  seedEditor,
  toolbarStyle,
} from "../../shared/demo-shared";

function buildToolbarItems(isEraserDisabled: boolean): KritzelToolbarItem[] {
  return [
    {
      name: "select",
      type: "tool",
      isDefault: true,
      tool: KritzelSelectionTool,
      icon: "cursor",
    },
    {
      name: "brush",
      type: "tool",
      tool: KritzelBrushTool,
      icon: "pen",
      config: {
        color: { light: "#1f2937", dark: "#f3f4f6" },
        size: 6,
        palette: [
          { light: "#1f2937", dark: "#f3f4f6", label: "Ink" },
          { light: "#087ea4", dark: "#7dd3fc", label: "Accent" },
        ],
      },
    },
    {
      name: "eraser",
      type: "tool",
      tool: KritzelEraserTool,
      icon: "eraser",
      // Demonstrates the function form of `isDisabled` for dynamic, state-driven control.
      isDisabled: () => isEraserDisabled,
    },
    {
      name: "config",
      type: "config",
    },
  ];
}

export function ToolsToolbarItemDisablePage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [isEraserDisabled, setIsEraserDisabled] = useState(true);

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        <button
          style={buttonStyle(false)}
          onClick={() => setIsEraserDisabled(!isEraserDisabled)}
        >
          {isEraserDisabled ? "Enable eraser tool" : "Disable eraser tool"}
        </button>
        <span style={{ fontSize: "13px", color: isEraserDisabled ? "#e53935" : "#333" }}>
          {isEraserDisabled ? "Eraser tool disabled" : "Eraser tool enabled"}
        </span>
      </div>
      <KritzelEditor
        ref={editorRef}
        editorId="tools-toolbar-item-disable"
        theme="light"
        themes={[reactThemeLight]}
        toolbarItems={buildToolbarItems(isEraserDisabled)}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        onIsReady={() => {
          if (editorRef.current) {
            void seedEditor(editorRef.current);
          }
        }}
        style={editorStyle}
      />
    </div>
  );
}
