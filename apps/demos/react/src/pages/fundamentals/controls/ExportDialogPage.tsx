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

export function ExportDialogPage() {
  const editorRef = useRef<HTMLUpmadeEditorElement | null>(null);
  const [workspaces] = useState(() => [
    new UpmadeWorkspace({ objects: createSeedObjects() }),
  ]);

  async function openDialog() {
    await editorRef.current?.openExportDialog();
  }

  async function closeDialog() {
    await editorRef.current?.closeExportDialog();
  }

  async function onReady() {
    await new Promise((resolve) => window.setTimeout(resolve, 100));
    await openDialog();
  }

  return (
    <div style={hostStyle}>
      <Toolbar>
        <button type="button" onClick={() => void openDialog()}>Open export dialog</button>
        <button type="button" onClick={() => void closeDialog()}>Close export dialog</button>
      </Toolbar>
      <UpmadeEditor
        ref={editorRef}
        editorId="export-dialog"
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
        onIsReady={() => void onReady()}
        style={editorStyle}
      />
    </div>
  );
}