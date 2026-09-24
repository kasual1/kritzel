import { useMemo, useRef, useState } from "react";
import {
  KritzelBrushTool,
  KritzelEditor,
  KritzelEraserTool,
  KritzelSelectionTool,
  type HTMLKritzelEditorElement,
  type KritzelToolbarItem,
} from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import {
  buttonStyle,
  editorStyle,
  hostStyle,
  seedEditor,
  toolbarStyle,
} from "../../shared/demo-shared";

const themes = [reactThemeLight, reactThemeDark];

export function ToolsDisablePage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [isEraserDisabled, setIsEraserDisabled] = useState(true);
  const toolbarItems = useMemo<KritzelToolbarItem[]>(() => [
    {
      name: "selection",
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
    },
    {
      name: "eraser",
      type: "tool",
      tool: KritzelEraserTool,
      icon: "eraser",
      isDisabled: () => isEraserDisabled,
    },
    {
      name: "config",
      type: "config",
    },
  ], [isEraserDisabled]);

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        <button style={buttonStyle(false)} onClick={() => setIsEraserDisabled((value) => !value)}>
          {isEraserDisabled ? "Enable eraser tool" : "Disable eraser tool"}
        </button>
      </div>
      <KritzelEditor
        ref={editorRef}
        editorId="tools-disable"
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
