import { useRef, useState } from "react";
import { KritzelEngine, type HTMLKritzelEngineElement } from "@kritzel/react-engine";
import { createSeedObjects } from "../../getting-started/seed-objects";

export function ImportExportWorkspaceImportPage() {
  const engineRef = useRef<HTMLKritzelEngineElement | null>(null);
  const [jsonInput, setJsonInput] = useState("");
  const [activeWorkspaceName, setActiveWorkspaceName] = useState("");

  // seed a workspace and pre-fill the textarea with a valid, importable JSON sample
  async function onReady() {
    const engine = engineRef.current;
    if (!engine) {
      return;
    }

    for (const obj of createSeedObjects()) {
      await engine.addObject(obj);
    }

    setJsonInput(await engine.exportAsJson());
    setActiveWorkspaceName((await engine.getActiveWorkspace())?.name ?? "");
  }

  async function importJson() {
    const engine = engineRef.current;
    if (!engine) {
      return;
    }

    await engine.importFromJson(jsonInput);
    setActiveWorkspaceName((await engine.getActiveWorkspace())?.name ?? "");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#f5f5f5", borderBottom: "1px solid #e0e0e0" }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: "#61dafb", marginRight: 4 }}>Workspace Import</span>
        <span style={{ fontSize: 12, color: "#555" }}>Active workspace: {activeWorkspaceName}</span>
      </div>
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <KritzelEngine
          ref={engineRef}
          editorId="import-export-workspace-import"
          isPanningEnabled={false}
          isZoomingEnabled={false}
          onIsEngineReady={() => {
            void onReady();
          }}
          style={{ flex: "1 1 60%", minHeight: 0, display: "block" }}
        />
        <div style={{ flex: "1 1 40%", display: "flex", flexDirection: "column", gap: 8, padding: 12, borderLeft: "1px solid #e0e0e0" }}>
          <textarea
            style={{ flex: 1, resize: "none", fontSize: 11, lineHeight: 1.4, padding: 8, boxSizing: "border-box" }}
            value={jsonInput}
            onChange={(event) => setJsonInput(event.target.value)}
            spellCheck={false}
          />
          <button style={{ alignSelf: "flex-start" }} onClick={() => void importJson()}>
            Import Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
