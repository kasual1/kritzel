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
    name: "selection",
    type: "tool",
    tool: UpdrawSelectionTool,
    icon: "cursor",
  },
  {
    name: "brush",
    type: "tool",
    tool: UpdrawBrushTool,
    icon: "pen",
    isDefault: true,
  },
  {
    name: "text",
    type: "tool",
    tool: UpdrawTextTool,
    icon: "type",
  },
  {
    name: "config",
    type: "config",
  },
];

export function ToolsToolbarPage() {
  const editorRef = useRef<HTMLUpdrawEditorElement | null>(null);

  return (
    <div style={hostStyle}>
      <UpdrawEditor
        ref={editorRef}
        editorId="tools-toolbar"
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
