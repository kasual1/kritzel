import { CSSProperties } from "react";
import { KritzelEditor, KritzelWorkspace } from "@kritzel/react-editor";
import { reactThemeLight } from "../../const/react-theme-light";
import { createSeedObjects } from "./seed-objects";

const hostStyle: CSSProperties = {
  display: "block",
  height: "100%",
};

const themes = [reactThemeLight];
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })];

export function QuickStartPage() {
  return (
    <div style={hostStyle}>
      <KritzelEditor
        editorId="quickstart"
        theme="light"
        themes={themes}
        workspaces={workspaces}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
      />
    </div>
  );
}
