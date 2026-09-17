import { useRef, useState } from "react";
import { KritzelEngine, type HTMLKritzelEngineElement } from "@kritzel/react-engine";
import { createSeedObjects } from "../../getting-started/seed-objects";

export function ImportExportWorkspaceExportPage() {
  const engineRef = useRef<HTMLKritzelEngineElement | null>(null);
  const [jsonPreview, setJsonPreview] = useState('Click "Preview as JSON" to see the exported workspace.');

  async function onReady() {
    const engine = engineRef.current;
    if (!engine) {
      return;
    }

    for (const obj of createSeedObjects()) {
      await engine.addObject(obj);
    }
  }

  async function previewJson() {
    const json = await engineRef.current?.exportAsJson();
    setJsonPreview(json ?? "");
  }

  async function downloadJson() {
    await engineRef.current?.downloadAsJson();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#f5f5f5", borderBottom: "1px solid #e0e0e0" }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: "#61dafb", marginRight: 4 }}>Workspace Export</span>
        <button onClick={() => void previewJson()}>Preview as JSON</button>
        <button onClick={() => void downloadJson()}>Download JSON</button>
      </div>
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <KritzelEngine
          ref={engineRef}
          editorId="import-export-workspace-export"
          isPanningEnabled={false}
          isZoomingEnabled={false}
          onIsEngineReady={() => {
            void onReady();
          }}
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
