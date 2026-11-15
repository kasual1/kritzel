import { useRef } from "react";
import {
  UpmadeBrushTool,
  UpmadeEditor,
  UpmadeSelectionTool,
  UpmadeTextTool,
  type HTMLUpmadeEditorElement,
  type UpmadeToolbarItem,
} from "@upmade/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { editorStyle, hostStyle, seedEditor } from "../../shared/demo-shared";

const themes = [reactThemeLight, reactThemeDark];

const toolbarItems: UpmadeToolbarItem[] = [
  {
    name: "selection",
    type: "tool",
    tool: UpmadeSelectionTool,
    icon: "cursor",
  },
  {
    name: "brush",
    type: "tool",
    tool: UpmadeBrushTool,
    icon: "pen",
    isDefault: true,
  },
  {
    name: "text",
    type: "tool",
    tool: UpmadeTextTool,
    icon: "type",
  },
  {
    name: "config",
    type: "config",
  },
];

export function ToolsToolbarPage() {
  const editorRef = useRef<HTMLUpmadeEditorElement | null>(null);

  return (
    <div style={hostStyle}>
      <UpmadeEditor
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
