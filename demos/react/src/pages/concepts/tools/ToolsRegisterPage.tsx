import { useRef } from "react";
import {
  KritzelBrushTool,
  KritzelEditor,
  KritzelSelectionTool,
  KritzelTextTool,
  HTMLKritzelEditorElement,
  type KritzelBrushToolConfig,
  type KritzelToolbarControl,
} from "kritzel-react";
import { reactThemeLight } from "../../../const/react-theme-light";
import { editorStyle, hostStyle, seedEditor } from "../shared/concept-shared";

const highlighterConfig: KritzelBrushToolConfig = {
  type: "highlighter",
  color: { light: "#ffeb3b", dark: "#fff176" },
  size: 20,
  palettes: {
    highlighter: [
      { light: "#ffeb3b", dark: "#fff176", label: "Yellow" },
      { light: "#76ff03", dark: "#b2ff59", label: "Green" },
    ],
  },
};

const controls: KritzelToolbarControl[] = [
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
      type: "pen",
      color: { light: "#1f2937", dark: "#f3f4f6" },
      size: 6,
      palettes: {
        pen: [
          { light: "#1f2937", dark: "#f3f4f6", label: "Ink" },
          { light: "#087ea4", dark: "#7dd3fc", label: "Accent" },
        ],
      },
    },
  },
  {
    name: "highlighter",
    type: "tool",
    tool: KritzelBrushTool,
    icon: "highlighter",
    config: {
      type: "highlighter",
      color: { light: "#ffeb3b", dark: "#fff176" },
      size: 20,
      opacity: 0.6,
      palettes: {
        highlighter: [
          { light: "#ffeb3b", dark: "#fff176", label: "Yellow" },
          { light: "#76ff03", dark: "#b2ff59", label: "Green" },
        ],
      },
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
        theme="react-theme"
        themes={[reactThemeLight]}
        controls={controls}
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
