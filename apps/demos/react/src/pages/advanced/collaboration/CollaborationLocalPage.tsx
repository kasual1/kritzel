import { useMemo } from "react";
import {
  BroadcastSyncProvider,
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

export function CollaborationLocalPage() {
  const syncConfig = useMemo<KritzelSyncConfig>(
    () => ({ providers: [BroadcastSyncProvider] }),
    [],
  );
  const workspaces = useMemo(
    () => [new KritzelWorkspace({ objects: createSeedObjects() })],
    [],
  );

  return (
    <div style={{ ...hostStyle, background: "linear-gradient(160deg, #e9f8ff 0%, #ffffff 46%)" }}>
      <Toolbar>
        <span className="label">Cross-tab Sync</span>
        <span className="status">BroadcastChannel enabled</span>
      </Toolbar>
      <KritzelEditor
        editorId="collaboration-local"
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
