import { useRef } from "react";
import {
  KritzelBrushTool,
  KritzelEditor,
  KritzelSelectionTool,
  KritzelTextTool,
  HTMLKritzelEditorElement,
  type KritzelToolbarItem,
} from "@kritzel/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";
import { editorStyle, hostStyle, seedEditor } from "../../shared/demo-shared";

const toolbarItems: KritzelToolbarItem[] = [
  {
    name: "select",
    type: "tool",
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
    isDefault: true,
  },
  {
    name: "text",
    type: "tool",
    tool: KritzelTextTool,
    icon: "type",
    config: {
      color: { light: "#1f2937", dark: "#f3f4f6" },
      size: 18,
      fontFamily: "Arial",
      palette: [
        { light: "#1f2937", dark: "#f3f4f6" },
        { light: "#087ea4", dark: "#7dd3fc" },
      ],
    },
  },
  {
    name: "config",
    type: "config",
  },
];

export function ToolsToolbarPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);

  return (
    <div style={hostStyle}>
      <KritzelEditor
        ref={editorRef}
        editorId="tools-toolbar"
        theme="light"
        themes={[reactThemeLight]}
        toolbarItems={toolbarItems}
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
