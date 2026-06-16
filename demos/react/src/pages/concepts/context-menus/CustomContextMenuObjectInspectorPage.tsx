import { useMemo, useRef } from "react";
import {
  KritzelEditor,
  type ContextMenuItem,
  HTMLKritzelEditorElement,
} from "kritzel-react";
import { customReactTheme } from "../../../const/custom-react-theme";
import { editorStyle, hostStyle, seedEditor } from "../shared/concept-shared";

export function CustomContextMenuObjectInspectorPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);

  const globalItems = useMemo<ContextMenuItem[]>(
    () => [
      {
        label: "Paste",
        icon: "paste",
        group: "clipboard",
        disabled: async () => ((await editorRef.current?.getCopiedObjects()) ?? []).length === 0,
        action: async (menu) => {
          await editorRef.current?.paste(menu.x, menu.y);
        },
      },
      {
        label: "Select All",
        icon: "select-all",
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
        disabled: async () => ((await editorRef.current?.getCopiedObjects()) ?? []).length === 0,
        action: async (menu) => {
          await editorRef.current?.paste(menu.x, menu.y);
        },
      },
      {
        label: "Parent",
        group: "arrange",
        children: [
          { label: "Child 1", action: async () => window.alert("Child 1 clicked") },
          {
            label: "Child 2",
            children: [
              { label: "Grandchild 1", action: async () => window.alert("Grandchild 1 clicked") },
              { label: "Grandchild 2", action: async () => window.alert("Grandchild 2 clicked") },
            ],
          },
          { label: "Child 3", action: async () => window.alert("Child 3 clicked") },
        ],
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
        editorId="custom-context-menu-object-inspector"
        theme="react-theme"
        themes={[customReactTheme]}
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
