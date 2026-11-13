import { useMemo, useRef, useState } from "react";
import {
  UpdrawBrushTool,
  UpdrawEditor,
  UpdrawEraserTool,
  UpdrawSelectionTool,
  type HTMLUpdrawEditorElement,
  type UpdrawToolbarItem,
} from "@updraw/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import {
  editorStyle,
  hostStyle,
  seedEditor,
} from "../../shared/demo-shared";
import { Toolbar } from "../../../components/Toolbar";

const themes = [reactThemeLight, reactThemeDark];

export function ToolsDisablePage() {
  const editorRef = useRef<HTMLUpdrawEditorElement | null>(null);
  const [isEraserDisabled, setIsEraserDisabled] = useState(true);
  const toolbarItems = useMemo<UpdrawToolbarItem[]>(() => [
    {
      name: "selection",
      type: "tool",
      isDefault: true,
      tool: UpdrawSelectionTool,
      icon: "cursor",
    },
    {
      name: "brush",
      type: "tool",
      tool: UpdrawBrushTool,
      icon: "pen",
    },
    {
      name: "eraser",
      type: "tool",
      tool: UpdrawEraserTool,
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
      <Toolbar>
        <button onClick={() => setIsEraserDisabled((value) => !value)}>
          {isEraserDisabled ? "Enable eraser tool" : "Disable eraser tool"}
        </button>
      </Toolbar>
      <UpdrawEditor
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
