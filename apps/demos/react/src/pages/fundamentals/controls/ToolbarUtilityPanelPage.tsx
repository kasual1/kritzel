import { useState } from "react";
import { KritzelEditor, KritzelWorkspace } from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { createSeedObjects } from "../../getting-started/seed-objects";
import { editorStyle, hostStyle, toolbarStyle } from "../../shared/demo-shared";

const themes = [reactThemeLight, reactThemeDark];

export function ToolbarUtilityPanelPage() {
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);
  const [isUtilityPanelVisible, setIsUtilityPanelVisible] = useState(true);
  const [workspaces] = useState(() => [
    new KritzelWorkspace({ objects: createSeedObjects() }),
  ]);

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#333", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={isToolbarVisible}
            onChange={(event) => setIsToolbarVisible(event.currentTarget.checked)}
          />
          <span>Toolbar</span>
        </label>
        <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#333", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={isUtilityPanelVisible}
            onChange={(event) => setIsUtilityPanelVisible(event.currentTarget.checked)}
          />
          <span>Utility panel</span>
        </label>
      </div>
      <KritzelEditor
        editorId="toolbar-utility-panel"
        theme="light"
        themes={themes}
        workspaces={workspaces}
        syncConfig={undefined}
        loginConfig={undefined}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isToolbarVisible={isToolbarVisible}
        isUtilityPanelVisible={isUtilityPanelVisible}
        style={editorStyle}
      />
    </div>
  );
}