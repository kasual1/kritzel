import { CSSProperties } from "react";
import { KritzelEditor, type KritzelSyncConfig } from "kritzel-react";
import { customReactTheme } from "../../../const/custom-react-theme";

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
        themes={[customReactTheme]}
        syncConfig={syncConfig}
        wheelEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
      />
    </div>
  );
}
