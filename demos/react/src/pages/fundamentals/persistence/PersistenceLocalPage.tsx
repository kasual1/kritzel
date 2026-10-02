import { useRef } from "react";
import {
  IndexedDBSyncProvider,
  KritzelEditor,
  type HTMLKritzelEditorElement,
  type KritzelSyncConfig,
} from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { createSeedObjects } from "../../getting-started/seed-objects";
import {
  editorStyle,
  hostStyle,
} from "../../shared/demo-shared";

const themes = [reactThemeLight, reactThemeDark];
const syncConfig: KritzelSyncConfig = {
  providers: [IndexedDBSyncProvider],
  appStateId: "persistence-local",
};

export function PersistenceLocalPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);

  async function onReady() {
    const editor = editorRef.current;
    if (!editor) return;

    const existing = await editor.getAllObjects();
    if (existing.length === 0) {
      await editor.addObjects(createSeedObjects());
    }
  }

  return (
    <div style={{ ...hostStyle, background: "linear-gradient(180deg, #f3fbff 0%, #ffffff 100%)" }}>
      <KritzelEditor
        ref={editorRef}
        editorId="persistence-local"
        syncConfig={syncConfig}
        theme="light"
        themes={themes}
        loginConfig={undefined}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        onIsReady={() => void onReady()}
        style={editorStyle}
      />
    </div>
  );
}
