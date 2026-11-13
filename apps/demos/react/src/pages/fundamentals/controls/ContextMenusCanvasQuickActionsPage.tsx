import { useMemo, useRef, useState } from "react";
import {
  UpdrawEditor,
  UpdrawWorkspace,
  type ContextMenuItem,
  HTMLUpdrawEditorElement,
} from "@updraw/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { createSeedObjects } from "../../getting-started/seed-objects";
import { editorStyle, hostStyle } from "../../shared/demo-shared";

const themes = [reactThemeLight, reactThemeDark];
const objectItems: ContextMenuItem[] = [];

export function ContextMenusCanvasQuickActionsPage() {
  const editorRef = useRef<HTMLUpdrawEditorElement | null>(null);
  const [workspaces] = useState(() => [
    new UpdrawWorkspace({ objects: createSeedObjects() }),
  ]);

  const globalItems = useMemo<ContextMenuItem[]>(
    () => [
      {
        label: "Paste",
        icon: "paste",
        action: async (menu) => {
          await editorRef.current?.paste(menu.x, menu.y);
        },
      },
      {
        label: "Select All",
        icon: "selectAll",
        action: async () => {
          await editorRef.current?.selectAllObjectsInViewport();
        },
      },
    ],
    [],
  );

  async function onReady() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    await editor.openContextMenu({ x: -50, y: -50 });
  }

  return (
    <div style={hostStyle}>
      <UpdrawEditor
        ref={editorRef}
        editorId="custom-context-menu-canvas-quick-actions"
        theme="light"
        themes={themes}
        workspaces={workspaces}
        syncConfig={undefined}
        loginConfig={undefined}
        globalContextMenuItems={globalItems}
        objectContextMenuItems={objectItems}
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
