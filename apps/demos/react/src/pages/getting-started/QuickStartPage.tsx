import { CSSProperties } from "react";
import { UpdrawEditor, UpdrawWorkspace } from "@updraw/react-editor";
import { reactThemeLight } from "../../const/react-theme-light";
import { createSeedObjects } from "./seed-objects";

const hostStyle: CSSProperties = {
  display: "block",
  height: "100%",
};

const themes = [reactThemeLight];
const workspaces = [new UpdrawWorkspace({ objects: createSeedObjects() })];

export function QuickStartPage() {
  return (
    <div style={hostStyle}>
      <UpdrawEditor
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
