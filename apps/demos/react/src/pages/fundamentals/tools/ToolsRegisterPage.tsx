import { useRef } from "react";
import {
  KritzelBrushTool,
  KritzelEditor,
  KritzelSelectionTool,
  KritzelTextTool,
  HTMLKritzelEditorElement,
  type KritzelBrushToolConfig,
  type KritzelToolbarItem,
} from "@kritzel/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";
import { editorStyle, hostStyle, seedEditor } from "../../shared/demo-shared";

const highlighterConfig: KritzelBrushToolConfig = {
  color: { light: "#ffeb3b", dark: "#fff176" },
  size: 20,
  palette: [
    { light: "#ffeb3b", dark: "#fff176", label: "Yellow" },
    { light: "#76ff03", dark: "#b2ff59", label: "Green" },
  ],
};

const toolbarItems: KritzelToolbarItem[] = [
  {
    name: "select",
    type: "tool",
    tool: KritzelSelectionTool,
    icon: "cursor",
    isDefault: true,
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
    name: "highlighter",
    type: "tool",
    tool: KritzelBrushTool,
    icon: "highlighter",
    config: {
      color: { light: "#ffeb3b", dark: "#fff176" },
      size: 20,
      opacity: 0.6,
      palette: [
        { light: "#ffeb3b", dark: "#fff176", label: "Yellow" },
        { light: "#76ff03", dark: "#b2ff59", label: "Green" },
      ],
    },
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

export function ToolsRegisterPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);

  async function onReady() {
    if (!editorRef.current) {
      return;
    }

    await seedEditor(editorRef.current);
    await editorRef.current.registerTool("highlighter", KritzelBrushTool, highlighterConfig);
  }

  return (
    <div style={hostStyle}>
      <KritzelEditor
        ref={editorRef}
        editorId="tools-register"
        theme="light"
        themes={[reactThemeLight]}
        toolbarItems={toolbarItems}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        onIsReady={() => {
          void onReady();
        }}
        style={editorStyle}
      />
    </div>
  );
}
