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
} from "../../shared/demo-shared";
import { Toolbar } from "../../../components/Toolbar";

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
      <Toolbar>
        <span className="label">Real-time Sync</span>
        <span className="status">Configured for Hocuspocus server</span>
      </Toolbar>
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
