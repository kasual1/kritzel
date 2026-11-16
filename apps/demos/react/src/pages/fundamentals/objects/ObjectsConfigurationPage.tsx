import { useMemo, useState } from "react";
import {
  UPMADE_DEFAULT_OBJECT_TITLEBAR,
  UpmadeEditor,
  UpmadeWorkspace,
  type UpmadeObjectConfig,
} from "@upmade/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { createSeedObjects } from "../../getting-started/seed-objects";
import { editorStyle, hostStyle, toolbarStyle } from "../../shared/demo-shared";

const themes = [reactThemeLight, reactThemeDark];

const checkboxStyle = { display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#333", cursor: "pointer" };

export function ObjectsConfigurationPage() {
  const [areShapesRotatable, setAreShapesRotatable] = useState(false);
  const [areShapesResizable, setAreShapesResizable] = useState(false);
  const [workspaces] = useState(() => [
    new UpmadeWorkspace({ objects: createSeedObjects() }),
  ]);

  // A new object on every change, so that the editor rerenders with the new rules.
  const objectConfig = useMemo<UpmadeObjectConfig>(
    () => ({
      hasTitlebar: (object) => object.__class__ === "UpmadeShape",
      isRotatable: (object) => areShapesRotatable || object.__class__ !== "UpmadeShape",
      isResizable: (object) => areShapesResizable || object.__class__ !== "UpmadeShape",
    }),
    [areShapesRotatable, areShapesResizable],
  );

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        <label style={checkboxStyle}>
          <input
            type="checkbox"
            checked={areShapesRotatable}
            onChange={(event) => setAreShapesRotatable(event.currentTarget.checked)}
          />
          <span>Rotate shapes</span>
        </label>
        <label style={checkboxStyle}>
          <input
            type="checkbox"
            checked={areShapesResizable}
            onChange={(event) => setAreShapesResizable(event.currentTarget.checked)}
          />
          <span>Resize shapes</span>
        </label>
      </div>
      <UpmadeEditor
        editorId="objects-configuration"
        theme="light"
        themes={themes}
        workspaces={workspaces}
        syncConfig={undefined}
        loginConfig={undefined}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        objectTitlebar={UPMADE_DEFAULT_OBJECT_TITLEBAR}
        objectConfig={objectConfig}
        style={editorStyle}
      />
    </div>
  );
}
