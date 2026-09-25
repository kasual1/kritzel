import { useRef } from "react";
import {
  KritzelBrushTool,
  KritzelEditor,
  KritzelSelectionTool,
  KritzelTextTool,
  type HTMLKritzelEditorElement,
  type KritzelToolbarItem,
} from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { editorStyle, hostStyle, seedEditor } from "../../shared/demo-shared";

const themes = [reactThemeLight, reactThemeDark];

const toolbarItems: KritzelToolbarItem[] = [
  {
    name: "selection",
    type: "tool",
    tool: KritzelSelectionTool,
    icon: "cursor",
  },
  {
    name: "brush",
    type: "tool",
    tool: KritzelBrushTool,
    icon: "pen",
    isDefault: true,
  },
  {
    name: "text",
    type: "tool",
    tool: KritzelTextTool,
    icon: "type",
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
