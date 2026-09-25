import { useRef, useState, type CSSProperties } from "react";
import {
  InMemorySyncProvider,
  KritzelEditor,
  KritzelLine,
  KritzelPath,
  KritzelShape,
  ShapeType,
  type HTMLKritzelEditorElement,
  type KritzelBaseObject,
  type KritzelSyncConfig,
  type KritzelWorkspace,
} from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import {
  buttonStyle,
  editorStyle,
  hostStyle,
  toolbarStyle,
} from "../../shared/demo-shared";

interface WorkspaceVariant {
  name: string;
  shapeType: ShapeType;
  fill: { light: string; dark: string };
  stroke: { light: string; dark: string };
  accent: { light: string; dark: string };
  rotation: number;
}

const themes = [reactThemeLight, reactThemeDark];
const syncConfig: KritzelSyncConfig = {
  providers: [InMemorySyncProvider],
};
const workspaceVariants: WorkspaceVariant[] = [
  { name: "Project Board", shapeType: ShapeType.Rectangle, fill: { light: "#fce4ec", dark: "#880e4f" }, stroke: { light: "#c62828", dark: "#ef9a9a" }, accent: { light: "#ff9800", dark: "#ffb74d" }, rotation: 0 },
  { name: "Sprint Planning", shapeType: ShapeType.Ellipse, fill: { light: "#e3f2fd", dark: "#1a237e" }, stroke: { light: "#1565c0", dark: "#90caf9" }, accent: { light: "#4caf50", dark: "#81c784" }, rotation: 15 },
  { name: "Design Review", shapeType: ShapeType.Triangle, fill: { light: "#f3e5f5", dark: "#4a148c" }, stroke: { light: "#6a1b9a", dark: "#ce93d8" }, accent: { light: "#00bcd4", dark: "#4dd0e1" }, rotation: 30 },
  { name: "Retrospective", shapeType: ShapeType.Rectangle, fill: { light: "#e8f5e9", dark: "#1b5e20" }, stroke: { light: "#2e7d32", dark: "#a5d6a7" }, accent: { light: "#e91e63", dark: "#f06292" }, rotation: 45 },
  { name: "Roadmap", shapeType: ShapeType.Ellipse, fill: { light: "#fff3e0", dark: "#e65100" }, stroke: { light: "#ef6c00", dark: "#ffcc80" }, accent: { light: "#3f51b5", dark: "#7986cb" }, rotation: 60 },
  { name: "Brainstorm", shapeType: ShapeType.Triangle, fill: { light: "#e0f7fa", dark: "#006064" }, stroke: { light: "#00838f", dark: "#80deea" }, accent: { light: "#ff5722", dark: "#ff8a65" }, rotation: 75 },
  { name: "User Journey", shapeType: ShapeType.Rectangle, fill: { light: "#fffde7", dark: "#f57f17" }, stroke: { light: "#f9a825", dark: "#fff59d" }, accent: { light: "#009688", dark: "#4db6ac" }, rotation: 90 },
  { name: "Architecture", shapeType: ShapeType.Ellipse, fill: { light: "#ede7f6", dark: "#311b92" }, stroke: { light: "#4527a0", dark: "#b39ddb" }, accent: { light: "#c2185b", dark: "#f48fb1" }, rotation: 105 },
  { name: "Release Notes", shapeType: ShapeType.Triangle, fill: { light: "#efebe9", dark: "#3e2723" }, stroke: { light: "#5d4037", dark: "#bcaaa4" }, accent: { light: "#673ab7", dark: "#9575cd" }, rotation: 120 },
  { name: "Team Sync", shapeType: ShapeType.Rectangle, fill: { light: "#e1f5fe", dark: "#01579b" }, stroke: { light: "#0277bd", dark: "#81d4fa" }, accent: { light: "#8bc34a", dark: "#aed581" }, rotation: 135 },
];
const contentStyle: CSSProperties = {
  display: "flex",
  flex: 1,
  minHeight: 0,
};
const infoPanelStyle: CSSProperties = {
  width: "300px",
  padding: "16px",
  overflow: "auto",
  borderLeft: "1px solid #ebebeb",
  background: "#ffffff",
};
const jsonStyle: CSSProperties = {
  margin: 0,
  overflowWrap: "anywhere",
  whiteSpace: "pre-wrap",
  fontFamily: "monospace",
  fontSize: "11px",
  lineHeight: 1.45,
};

function createVariantObjects(variant: WorkspaceVariant): KritzelBaseObject[] {
  return [
    new KritzelShape({
      translateX: -140,
      translateY: -170,
      width: 120,
      height: 120,
      shapeType: variant.shapeType,
      fillColor: variant.fill,
      strokeColor: variant.stroke,
      strokeWidth: 3,
    }),
    new KritzelShape({
      translateX: 20,
      translateY: -150,
      width: 120,
      height: 120,
      shapeType: variant.shapeType,
      fillColor: variant.fill,
      strokeColor: variant.accent,
      strokeWidth: 3,
      rotation: variant.rotation,
    }),
    new KritzelLine({
      startX: -170,
      startY: 10,
      endX: 130,
      endY: 10,
      stroke: variant.accent,
      strokeWidth: 3,
    }),
    new KritzelPath({
      points: [
        [0, 0, 0.5],
        [30, -40, 0.5],
        [60, -10, 0.5],
        [90, -50, 0.5],
        [120, -20, 0.5],
        [150, -60, 0.5],
        [180, -30, 0.5],
        [210, -70, 0.5],
        [240, -40, 0.5],
      ],
      translateX: -125,
      translateY: 125,
      strokeWidth: 8,
      fill: variant.stroke,
      rotation: variant.rotation,
    }),
  ];
}

export function WorkspacesUpdatePage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const variantIndexRef = useRef(0);
  const [activeWorkspace, setActiveWorkspace] = useState<KritzelWorkspace | null>(
    null,
  );

  async function refreshActiveWorkspace() {
    setActiveWorkspace((await editorRef.current?.getActiveWorkspace()) ?? null);
  }

  async function updateWorkspace() {
    const editor = editorRef.current;
    const workspace = (await editor?.getActiveWorkspace())?.clone();
    if (!editor || !workspace) return;

    const variant = workspaceVariants[variantIndexRef.current];
    variantIndexRef.current =
      (variantIndexRef.current + 1) % workspaceVariants.length;
    workspace.name = variant.name;
    workspace.objects = createVariantObjects(variant);

    await editor.updateWorkspace(workspace);
    await refreshActiveWorkspace();
  }

  async function onReady() {
    await updateWorkspace();
  }

  const activeWorkspaceJson = activeWorkspace
    ? JSON.stringify(activeWorkspace.serialize({ includeObjects: true }), null, 2)
    : "";

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        <button style={buttonStyle()} onClick={() => void updateWorkspace()}>
          Update Workspace
        </button>
        <span style={{ fontSize: "13px" }}>
          Current: {activeWorkspace?.name}
        </span>
      </div>
      <div style={contentStyle}>
        <KritzelEditor
          ref={editorRef}
          editorId="workspaces-update"
          theme="light"
          themes={themes}
          syncConfig={syncConfig}
          loginConfig={undefined}
          isPanningEnabled={false}
          isZoomingEnabled={false}
          isMoreMenuVisible={false}
          isWorkspaceManagerVisible={false}
          onIsReady={() => void onReady()}
          onObjectsChange={() => void refreshActiveWorkspace()}
          style={editorStyle}
        />
        <aside style={infoPanelStyle}>
          <h3>Active Workspace</h3>
          <pre style={jsonStyle}>{activeWorkspaceJson}</pre>
        </aside>
      </div>
    </div>
  );
}