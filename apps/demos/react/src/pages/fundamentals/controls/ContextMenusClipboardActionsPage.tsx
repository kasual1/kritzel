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

export function ContextMenusClipboardActionsPage() {
  const editorRef = useRef<HTMLUpdrawEditorElement | null>(null);
  const [workspaces] = useState(() => [
    new UpdrawWorkspace({ objects: createSeedObjects() }),
  ]);

  const globalItems = useMemo<ContextMenuItem[]>(
    () => [
      {
        label: "Paste",
        icon: "paste",
        group: "clipboard",
        action: async (menu) => {
          await editorRef.current?.paste(menu.x, menu.y);
        },
      },
      {
        label: "Select All",
        icon: "selectAll",
        group: "clipboard",
        action: async () => {
          await editorRef.current?.selectAllObjectsInViewport();
        },
      },
    ],
    [],
  );

  const objectItems = useMemo<ContextMenuItem[]>(
    () => [
      {
        label: "Copy",
        icon: "copy",
        group: "clipboard",
        action: async () => {
          await editorRef.current?.copy();
        },
      },
      {
        label: "Paste",
        icon: "paste",
        group: "clipboard",
        action: async (menu) => {
          await editorRef.current?.paste(menu.x, menu.y);
        },
      },
      {
        label: "Delete",
        icon: "delete",
        group: "destructive",
        action: async () => {
          await editorRef.current?.delete();
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

    await editor.selectAllObjectsInViewport();
    const selected = await editor.getSelectedObjects();
    if (!selected[0]) {
      return;
    }

    await editor.openContextMenu({
      x: selected[0].translateX + 50,
      y: selected[0].translateY + 50,
    });
  }

  return (
    <div style={hostStyle}>
      <UpdrawEditor
        ref={editorRef}
        editorId="custom-context-menu-clipboard-actions"
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
