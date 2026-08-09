import { useMemo, useRef } from "react";
import {
  HocuspocusSyncProvider,
  IndexedDBSyncProvider,
  KritzelEditor,
  HTMLKritzelEditorElement,
  type KritzelSyncConfig,
} from "kritzel-react";
import { reactThemeLight } from "../../../const/react-theme-light";
import {
  editorStyle,
  hostStyle,
  seedEditor,
  toolbarStyle,
} from "../shared/concept-shared";

export function CollaborationRealtimePage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const syncConfig = useMemo<KritzelSyncConfig>(
    () => ({
      providers: [
        IndexedDBSyncProvider,
        HocuspocusSyncProvider.with({ url: "wss://your-hocuspocus-server.com" }),
      ],
    }),
    [],
  );

  return (
    <div style={{ ...hostStyle, background: "radial-gradient(circle at 0% 0%, #e9f8ff 0%, #ffffff 42%)" }}>
      <div style={toolbarStyle}>
        <span style={{ fontWeight: 700, color: "#087ea4", fontSize: "13px" }}>Real-time Sync</span>
        <span style={{ fontSize: "12px", color: "#065d7a" }}>Configured for Hocuspocus server</span>
      </div>
      <KritzelEditor
        ref={editorRef}
        editorId="collaboration-realtime"
        syncConfig={syncConfig}
        theme="light"
        themes={[reactThemeLight]}
        loginConfig={undefined}
        isPanningEnabled={false}
        isZoomingEnabled={false}
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
