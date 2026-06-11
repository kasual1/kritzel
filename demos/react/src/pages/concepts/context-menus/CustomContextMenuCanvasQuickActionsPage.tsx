import { useMemo, useRef } from "react";
import {
  KritzelEditor,
  type ContextMenuItem,
  HTMLKritzelEditorElement,
} from "kritzel-react";
import { customReactTheme } from "../../../const/custom-react-theme";
import { editorStyle, hostStyle, seedEditor } from "../shared/concept-shared";

export function CustomContextMenuCanvasQuickActionsPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);

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
        icon: "select-all",
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

    await seedEditor(editor);
    await editor.openContextMenu({ x: -50, y: -50 });
  }

  return (
    <div style={hostStyle}>
      <KritzelEditor
        ref={editorRef}
        editorId="custom-context-menu-canvas-quick-actions"
        wheelEnabled={false}
        theme="react-theme"
        themes={[customReactTheme]}
        globalContextMenuItems={globalItems}
        objectContextMenuItems={[]}
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
