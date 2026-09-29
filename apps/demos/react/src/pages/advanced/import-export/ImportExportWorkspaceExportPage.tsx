import { useMemo, useRef, useState } from "react";
import { KritzelEditor, KritzelWorkspace, type HTMLKritzelEditorElement } from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { createSeedObjects } from "../../getting-started/seed-objects";
import { Toolbar } from "../../../components/Toolbar";

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
      <Toolbar>
        <span className="label">Workspace Export</span>
        <button onClick={() => void previewJson()}>Preview as JSON</button>
        <button onClick={() => void downloadJson()}>Download JSON</button>
      </Toolbar>
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
