import { useRef } from "react";
import {
  IndexedDBSyncProvider,
  UpdrawEditor,
  type HTMLUpdrawEditorElement,
  type UpdrawSyncConfig,
} from "@updraw/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { createSeedObjects } from "../../getting-started/seed-objects";
import {
  editorStyle,
  hostStyle,
} from "../../shared/demo-shared";

const themes = [reactThemeLight, reactThemeDark];
const syncConfig: UpdrawSyncConfig = {
  providers: [IndexedDBSyncProvider],
  appStateId: "persistence-local",
};

export function PersistenceLocalPage() {
  const editorRef = useRef<HTMLUpdrawEditorElement | null>(null);

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
      <UpdrawEditor
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
