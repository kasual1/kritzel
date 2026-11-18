import { useMemo, useRef, useState } from "react";
import {
  UpmadeBrushTool,
  UpmadeEditor,
  UpmadeEraserTool,
  UpmadeSelectionTool,
  type HTMLUpmadeEditorElement,
  type UpmadeToolbarItem,
} from "@upmade/react-editor";
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
  const editorRef = useRef<HTMLUpmadeEditorElement | null>(null);
  const [isEraserDisabled, setIsEraserDisabled] = useState(true);
  const toolbarItems = useMemo<UpmadeToolbarItem[]>(() => [
    {
      name: "selection",
      type: "tool",
      isDefault: true,
      tool: UpmadeSelectionTool,
      icon: "cursor",
    },
    {
      name: "brush",
      type: "tool",
      tool: UpmadeBrushTool,
      icon: "pen",
    },
    {
      name: "eraser",
      type: "tool",
      tool: UpmadeEraserTool,
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
      <UpmadeEditor
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
