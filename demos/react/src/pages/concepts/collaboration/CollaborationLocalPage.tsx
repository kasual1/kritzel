import { useMemo, useRef } from "react";
import {
  BroadcastSyncProvider,
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

export function CollaborationLocalPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const syncConfig = useMemo<KritzelSyncConfig>(
    () => ({ providers: [BroadcastSyncProvider] }),
    [],
  );

  return (
    <div style={{ ...hostStyle, background: "linear-gradient(160deg, #e9f8ff 0%, #ffffff 46%)" }}>
      <div style={toolbarStyle}>
        <span style={{ fontWeight: 700, color: "#087ea4", fontSize: "13px" }}>Cross-tab Sync</span>
        <span style={{ fontSize: "12px", color: "#065d7a" }}>BroadcastChannel enabled</span>
      </div>
      <KritzelEditor
        ref={editorRef}
        editorId="collaboration-local"
        syncConfig={syncConfig}
        theme="react-theme"
        themes={[reactThemeLight]}
        loginConfig={undefined}
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
