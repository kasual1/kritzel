import { useMemo } from "react";
import {
  HocuspocusSyncProvider,
  IndexedDBSyncProvider,
  KritzelEditor,
  type KritzelSyncConfig,
  KritzelWorkspace,
} from "@kritzel/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { createSeedObjects } from "../../getting-started/seed-objects";
import {
  editorStyle,
  hostStyle,
  toolbarStyle,
} from "../../shared/demo-shared";

export function CollaborationRealtimePage() {
  const syncConfig = useMemo<KritzelSyncConfig>(
    () => ({
      providers: [
        IndexedDBSyncProvider,
        HocuspocusSyncProvider.with({ url: "wss://your-hocuspocus-server.com" }),
      ],
    }),
    [],
  );
  const workspaces = useMemo(
    () => [new KritzelWorkspace({ objects: createSeedObjects() })],
    [],
  );

  return (
    <div style={{ ...hostStyle, background: "radial-gradient(circle at 0% 0%, #e9f8ff 0%, #ffffff 42%)" }}>
      <div style={toolbarStyle}>
        <span style={{ fontWeight: 700, color: "#087ea4", fontSize: "13px" }}>Real-time Sync</span>
        <span style={{ fontSize: "12px", color: "#065d7a" }}>Configured for Hocuspocus server</span>
      </div>
      <KritzelEditor
        editorId="collaboration-realtime"
        syncConfig={syncConfig}
        theme="light"
        themes={[reactThemeLight, reactThemeDark]}
        workspaces={workspaces}
        loginConfig={undefined}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        style={editorStyle}
      />
    </div>
  );
}
