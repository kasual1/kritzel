import { useRef } from "react";
import {
  UpdrawBrushTool,
  UpdrawEditor,
  UpdrawSelectionTool,
  UpdrawTextTool,
  type HTMLUpdrawEditorElement,
  type UpdrawToolbarItem,
} from "@updraw/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { editorStyle, hostStyle, seedEditor } from "../../shared/demo-shared";

const themes = [reactThemeLight, reactThemeDark];

const toolbarItems: UpdrawToolbarItem[] = [
  {
    name: "select",
    type: "tool",
    tool: UpdrawSelectionTool,
    icon: "cursor",
    isDefault: true,
  },
  {
    name: "brush",
    type: "tool",
    tool: UpdrawBrushTool,
    icon: "pen",
    config: {
      color: { light: "#1f2937", dark: "#f3f4f6" },
      size: 6,
      palette: [
        { light: "#1f2937", dark: "#f3f4f6", label: "Ink" },
        { light: "#4A7DFF", dark: "#5B8CFF", label: "React Blue" },
      ],
    },
  },
  {
    name: "highlighter",
    type: "tool",
    tool: UpdrawBrushTool,
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
    tool: UpdrawTextTool,
    icon: "type",
    config: {
      color: { light: "#1f2937", dark: "#f3f4f6" },
      size: 18,
      fontFamily: "Arial",
      palette: [
        { light: "#1f2937", dark: "#f3f4f6" },
        { light: "#4A7DFF", dark: "#5B8CFF" },
      ],
    },
  },
  {
    name: "config",
    type: "config",
  },
];

export function ToolsRegisterPage() {
  const editorRef = useRef<HTMLUpdrawEditorElement | null>(null);

  return (
    <div style={hostStyle}>
      <UpdrawEditor
        ref={editorRef}
        editorId="tools-register"
        theme="light"
        themes={themes}
        syncConfig={undefined}
        loginConfig={undefined}
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
