import { useRef, useState } from "react";
import {
  HTMLUpmadeEditorElement,
  InMemorySyncProvider,
  UpmadeEditor,
  UpmadeWorkspace,
  type UpmadeSyncConfig,
} from "@upmade/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { createSeedObjects } from "../../getting-started/seed-objects";
import { editorStyle, hostStyle, toolbarStyle } from "../../shared/demo-shared";

const themes = [reactThemeLight, reactThemeDark];
const syncConfig: UpmadeSyncConfig = { providers: [InMemorySyncProvider] };

export function WorkspaceManagerOpenPage() {
  const editorRef = useRef<HTMLUpmadeEditorElement | null>(null);
  const [isWorkspaceManagerVisible, setIsWorkspaceManagerVisible] = useState(true);
  const [workspaces] = useState(() => [
    new UpmadeWorkspace({ objects: createSeedObjects() }),
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
      <UpmadeEditor
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