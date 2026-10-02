import { useMemo, useRef } from "react";
import { KritzelEditor, KritzelWorkspace, type HTMLKritzelEditorElement } from "@kritzel/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { createSeedObjects } from "../../getting-started/seed-objects";
import { Toolbar } from "../../../components/Toolbar";

export function ImportExportViewportExportPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const workspaces = useMemo(
    () => [new KritzelWorkspace({ objects: createSeedObjects() })],
    [],
  );

  async function exportAsPng() {
    await editorRef.current?.exportViewportAsPng();
  }

  async function exportAsSvg() {
    await editorRef.current?.exportViewportAsSvg();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "sans-serif" }}>
      <Toolbar>
        <span className="label">Viewport Export</span>
        <button onClick={() => void exportAsPng()}>Export as PNG</button>
        <button onClick={() => void exportAsSvg()}>Export as SVG</button>
      </Toolbar>
      <KritzelEditor
        ref={editorRef}
        editorId="import-export-viewport-export"
        theme="light"
        themes={[reactThemeLight, reactThemeDark]}
        workspaces={workspaces}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        style={{ flex: 1, minHeight: 0 }}
      />
    </div>
  );
}
