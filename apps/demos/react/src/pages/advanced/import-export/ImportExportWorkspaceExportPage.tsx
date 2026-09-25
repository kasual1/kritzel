import { useMemo, useRef, useState } from "react";
import { KritzelEditor, KritzelWorkspace, type HTMLKritzelEditorElement } from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { createSeedObjects } from "../../getting-started/seed-objects";

export function ImportExportWorkspaceExportPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [jsonPreview, setJsonPreview] = useState('Click "Preview as JSON" to see the exported workspace.');
  const workspaces = useMemo(
    () => [new KritzelWorkspace({ id: "workspace-export", name: "Workspace Export", objects: createSeedObjects() })],
    [],
  );

  async function previewJson() {
    const json = await editorRef.current?.exportAsJson();
    if (json) {
      setJsonPreview(json);
    }
  }

  async function downloadJson() {
    await editorRef.current?.downloadAsJson();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#f5f5f5", borderBottom: "1px solid #e0e0e0" }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: "#61dafb", marginRight: 4 }}>Workspace Export</span>
        <button onClick={() => void previewJson()}>Preview as JSON</button>
        <button onClick={() => void downloadJson()}>Download JSON</button>
      </div>
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <KritzelEditor
          ref={editorRef}
          editorId="import-export-workspace-export"
          theme="light"
          themes={[reactThemeLight, reactThemeDark]}
          workspaces={workspaces}
          isPanningEnabled={false}
          isZoomingEnabled={false}
          isMoreMenuVisible={false}
          isWorkspaceManagerVisible={false}
          style={{ flex: "1 1 60%", minHeight: 0, display: "block" }}
        />
        <pre
          style={{
            flex: "1 1 40%",
            margin: 0,
            padding: 12,
            overflow: "auto",
            fontSize: 11,
            lineHeight: 1.4,
            background: "#1e1e1e",
            color: "#d4d4d4",
            borderLeft: "1px solid #e0e0e0",
          }}
        >
          {jsonPreview}
        </pre>
      </div>
    </div>
  );
}
