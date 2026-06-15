import { useMemo, useRef } from "react";
import {
  IndexedDBSyncProvider,
  KritzelEditor,
  HTMLKritzelEditorElement,
  type KritzelSyncConfig,
} from "kritzel-react";
import { customReactTheme } from "../../../const/custom-react-theme";
import {
  editorStyle,
  hostStyle,
  seedEditor,
  toolbarStyle,
} from "../shared/concept-shared";

export function PersistenceLocalPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const syncConfig = useMemo<KritzelSyncConfig>(
    () => ({ providers: [IndexedDBSyncProvider] }),
    [],
  );

  return (
    <div style={{ ...hostStyle, background: "linear-gradient(180deg, #f3fbff 0%, #ffffff 100%)" }}>
      <div style={toolbarStyle}>
        <span style={{ fontWeight: 700, color: "#087ea4", fontSize: "13px" }}>Persistence Provider:</span>
        <span style={{ fontSize: "12px", color: "#065d7a" }}>IndexedDB enabled</span>
      </div>
      <KritzelEditor
        ref={editorRef}
        editorId="persistence-local"
        wheelEnabled={false}
        syncConfig={syncConfig}
        theme="react-theme"
        themes={[customReactTheme]}
        loginConfig={undefined}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        onIsReady={() => {
          const editor = editorRef.current;
          if (!editor) {
            return;
          }

          void (async () => {
            const existing = await editor.getAllObjects();
            if (existing.length > 0) {
              return;
            }

            await seedEditor(editor);
          })();
        }}
        style={editorStyle}
      />
    </div>
  );
}
