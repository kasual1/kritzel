import { HocuspocusSyncProvider, KritzelEditor } from "kritzel-react";
import { reactThemeLight } from "../../const/react-theme-light";
import { reactThemeDark } from "../../const/react-theme-dark";

const syncConfig = {
  providers: [HocuspocusSyncProvider.with({ url: "wss://your-hocuspocus-server.com", connectionTimeout: 2000 })],
};

export function EditorHocuspocusPage() {
  return (
    <div className="app">
      <KritzelEditor
        theme="light"
        themes={[reactThemeLight, reactThemeDark]}
        syncConfig={syncConfig}
      />
    </div>
  );
}
