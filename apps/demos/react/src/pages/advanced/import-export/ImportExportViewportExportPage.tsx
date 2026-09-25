import { useMemo, useRef } from "react";
import { KritzelEditor, KritzelWorkspace, type HTMLKritzelEditorElement } from "@kritzel/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { createSeedObjects } from "../../getting-started/seed-objects";

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
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#f5f5f5", borderBottom: "1px solid #e0e0e0" }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: "#61dafb", marginRight: 4 }}>Viewport Export</span>
        <button onClick={() => void exportAsPng()}>Export as PNG</button>
        <button onClick={() => void exportAsSvg()}>Export as SVG</button>
      </div>
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
