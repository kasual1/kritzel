import { useMemo, useRef } from "react";
import {
  KritzelEditor,
  type ContextMenuItem,
  HTMLKritzelEditorElement,
} from "kritzel-react";
import { reactThemeLight } from "../../../const/react-theme-light";
import { editorStyle, hostStyle, seedEditor } from "../shared/concept-shared";

export function CustomContextMenuSmartConditionalPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);

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
        icon: "select-all",
        group: "clipboard",
        disabled: async () => ((await editorRef.current?.getObjectsInViewport()) ?? []).length === 0,
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
        label: "Export as PNG",
        icon: "download",
        group: "export",
        visible: async (_menu, objects) => objects.length === 1,
        action: async () => {
          await editorRef.current?.exportSelectedObjectsAsPng();
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

    await seedEditor(editor);
    await editor.selectAllObjectsInViewport();
    const selected = await editor.getSelectedObjects();
    if (!selected[0]) {
      return;
    }

    await editor.openContextMenu({
      x: selected[0].translateX + 50,
      y: selected[0].translateY + 50,
      objectId: selected[0].id,
    });
  }

  return (
    <div style={hostStyle}>
      <KritzelEditor
        ref={editorRef}
        editorId="custom-context-menu-smart-conditional"
        theme="react-theme"
        themes={[reactThemeLight]}
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
