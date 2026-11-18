import { useRef, useState } from "react";
import {
  HTMLUpmadeEditorElement,
  UpmadeEditor,
  UpmadeWorkspace,
} from "@upmade/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { createSeedObjects } from "../../getting-started/seed-objects";
import { editorStyle, hostStyle } from "../../shared/demo-shared";
import { Toolbar } from "../../../components/Toolbar";

const themes = [reactThemeLight, reactThemeDark];

export function ImportDialogPage() {
  const editorRef = useRef<HTMLUpmadeEditorElement | null>(null);
  const [workspaces] = useState(() => [
    new UpmadeWorkspace({ objects: createSeedObjects() }),
  ]);

  async function openDialog() {
    await editorRef.current?.openImportDialog();
  }

  return (
    <div style={hostStyle}>
      <Toolbar>
        <button type="button" onClick={() => void openDialog()}>Open import dialog</button>
      </Toolbar>
      <UpmadeEditor
        ref={editorRef}
        editorId="import-dialog"
        theme="light"
        themes={themes}
        workspaces={workspaces}
        syncConfig={undefined}
        loginConfig={undefined}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isToolbarVisible={false}
        isUtilityPanelVisible={false}
        isWorkspaceManagerVisible={false}
        isMoreMenuVisible={false}
        isZoomPanelVisible={false}
        style={editorStyle}
      />
    </div>
  );
}