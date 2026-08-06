import { CSSProperties } from "react";
import { KritzelEditor, type KritzelSyncConfig } from "kritzel-react";
import { reactThemeLight } from "../../../const/react-theme-light";

const syncConfig: KritzelSyncConfig = {
  providers: [],
};

const hostStyle: CSSProperties = {
  display: "block",
  height: "100%",
};

export function GettingStartedPage() {
  return (
    <div style={hostStyle}>
      <KritzelEditor
        editorId="getting-started"
        theme="react-theme"
        themes={[reactThemeLight]}
        syncConfig={syncConfig}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
      />
    </div>
  );
}
