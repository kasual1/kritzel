import { useState } from "react";
import { UpmadeEditor, UpmadeWorkspace } from "@upmade/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { createSeedObjects } from "../../getting-started/seed-objects";
import { editorStyle, hostStyle, toolbarStyle } from "../../shared/demo-shared";

const themes = [reactThemeLight, reactThemeDark];

export function ZoomPanelTogglePage() {
  const [isZoomPanelVisible, setIsZoomPanelVisible] = useState(true);
  const [workspaces] = useState(() => [
    new UpmadeWorkspace({ objects: createSeedObjects() }),
  ]);

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#333", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={isZoomPanelVisible}
            onChange={(event) => setIsZoomPanelVisible(event.currentTarget.checked)}
          />
          <span>Zoom panel</span>
        </label>
      </div>
      <UpmadeEditor
        editorId="zoom-panel-toggle"
        theme="light"
        themes={themes}
        workspaces={workspaces}
        syncConfig={undefined}
        loginConfig={undefined}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isZoomPanelVisible={isZoomPanelVisible}
        style={editorStyle}
      />
    </div>
  );
}