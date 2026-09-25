import { useRef, useState } from "react";
import {
  HTMLKritzelEditorElement,
  KritzelEditor,
  KritzelWorkspace,
} from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { createSeedObjects } from "../../getting-started/seed-objects";
import { buttonStyle, editorStyle, hostStyle, toolbarStyle } from "../../shared/demo-shared";

const themes = [reactThemeLight, reactThemeDark];

export function ImportDialogPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [workspaces] = useState(() => [
    new KritzelWorkspace({ objects: createSeedObjects() }),
  ]);

  async function openDialog() {
    await editorRef.current?.openImportDialog();
  }

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        <button type="button" style={buttonStyle(false)} onClick={() => void openDialog()}>Open import dialog</button>
      </div>
      <KritzelEditor
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