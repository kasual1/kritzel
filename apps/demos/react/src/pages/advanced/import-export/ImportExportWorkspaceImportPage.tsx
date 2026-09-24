import { useMemo, useRef, useState } from "react";
import {
  KritzelEditor,
  KritzelLine,
  KritzelPath,
  KritzelShape,
  KritzelWorkspace,
  ShapeType,
  type KritzelBaseObject,
  type HTMLKritzelEditorElement,
} from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { createSeedObjects } from "../../getting-started/seed-objects";

function createImportedWorkspaceObjects(): KritzelBaseObject[] {
  return [
    new KritzelShape({
      translateX: -140,
      translateY: -170,
      width: 120,
      height: 120,
      shapeType: ShapeType.Ellipse,
      fillColor: { light: "#e3f2fd", dark: "#e3f2fd" },
      strokeColor: { light: "#1565c0", dark: "#1565c0" },
      strokeWidth: 3,
    }),
    new KritzelShape({
      translateX: 20,
      translateY: -150,
      width: 120,
      height: 120,
      shapeType: ShapeType.Rectangle,
      fillColor: { light: "#e3f2fd", dark: "#e3f2fd" },
      strokeColor: { light: "#00bcd4", dark: "#00bcd4" },
      strokeWidth: 3,
    }),
    new KritzelLine({
      startX: -170,
      startY: 10,
      endX: 130,
      endY: 10,
      stroke: { light: "#00bcd4", dark: "#00bcd4" },
      strokeWidth: 3,
    }),
    new KritzelPath({
      points: [[0, 0, 0.5], [30, -40, 0.5], [60, -10, 0.5], [90, -50, 0.5], [120, -20, 0.5], [150, -60, 0.5], [180, -30, 0.5], [210, -70, 0.5], [240, -40, 0.5]],
      translateX: -125,
      translateY: 125,
      strokeWidth: 8,
      fill: { light: "#1565c0", dark: "#1565c0" },
    }),
  ];
}

function createImportedWorkspaceJson(): string {
  const workspace = new KritzelWorkspace({
    name: "Imported Workspace",
    objects: createImportedWorkspaceObjects(),
  });

  return JSON.stringify({
    ...workspace.serialize(),
    objects: workspace.objects?.map((object) => object.serialize()) ?? [],
  }, null, 2);
}

export function ImportExportWorkspaceImportPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [jsonInput] = useState(createImportedWorkspaceJson);
  const [activeWorkspaceName, setActiveWorkspaceName] = useState("");
  const workspaces = useMemo(
    () => [new KritzelWorkspace({ id: "workspace-import-initial", name: "Initial Workspace", objects: createSeedObjects() })],
    [],
  );

  async function onReady() {
    setActiveWorkspaceName((await editorRef.current?.getActiveWorkspace())?.name ?? "");
  }

  async function importJson() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    await editor.importFromJson(jsonInput);
    setActiveWorkspaceName((await editor.getActiveWorkspace())?.name ?? "");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#f5f5f5", borderBottom: "1px solid #e0e0e0" }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: "#61dafb", marginRight: 4 }}>Workspace Import</span>
        <button onClick={() => void importJson()}>Import Workspace</button>
        <span style={{ fontSize: 12, color: "#555" }}>Active workspace: {activeWorkspaceName}</span>
      </div>
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <KritzelEditor
          ref={editorRef}
          editorId="import-export-workspace-import"
          theme="light"
          themes={[reactThemeLight, reactThemeDark]}
          workspaces={workspaces}
          isPanningEnabled={false}
          isZoomingEnabled={false}
          isMoreMenuVisible={false}
          isWorkspaceManagerVisible={false}
          onIsReady={() => {
            void onReady();
          }}
          style={{ flex: "1 1 60%", minHeight: 0, display: "block" }}
        />
        <pre style={{ flex: "1 1 40%", margin: 0, padding: 12, overflow: "auto", whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: 11, lineHeight: 1.4, background: "#f8fafc", borderLeft: "1px solid #e0e0e0" }}>{jsonInput}</pre>
      </div>
    </div>
  );
}
