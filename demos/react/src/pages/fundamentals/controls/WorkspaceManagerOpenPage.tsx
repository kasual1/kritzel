import { useRef, useState } from "react";
import {
  HTMLKritzelEditorElement,
  InMemorySyncProvider,
  KritzelEditor,
  KritzelWorkspace,
  type KritzelSyncConfig,
} from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { createSeedObjects } from "../../getting-started/seed-objects";
import { editorStyle, hostStyle, toolbarStyle } from "../../shared/demo-shared";

const themes = [reactThemeLight, reactThemeDark];
const syncConfig: KritzelSyncConfig = { providers: [InMemorySyncProvider] };

export function WorkspaceManagerOpenPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [isWorkspaceManagerVisible, setIsWorkspaceManagerVisible] = useState(true);
  const [workspaces] = useState(() => [
    new KritzelWorkspace({ objects: createSeedObjects() }),
  ]);

  async function onReady() {
    await editorRef.current?.openWorkspaceManagerMenu();
  }

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#333", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={isWorkspaceManagerVisible}
            onChange={(event) => setIsWorkspaceManagerVisible(event.currentTarget.checked)}
          />
          <span>Workspace manager</span>
        </label>
      </div>
      <KritzelEditor
        ref={editorRef}
        editorId="workspace-manager-open"
        theme="light"
        themes={themes}
        workspaces={workspaces}
        syncConfig={syncConfig}
        loginConfig={undefined}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isWorkspaceManagerVisible={isWorkspaceManagerVisible}
        onIsReady={() => void onReady()}
        style={editorStyle}
      />
    </div>
  );
}