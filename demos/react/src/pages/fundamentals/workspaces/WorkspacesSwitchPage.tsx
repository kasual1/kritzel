import { useRef, useState, type CSSProperties } from "react";
import {
  InMemorySyncProvider,
  KritzelEditor,
  KritzelLine,
  KritzelPath,
  KritzelShape,
  KritzelWorkspace,
  ShapeType,
  type ActiveWorkspaceChangeEvent,
  type HTMLKritzelEditorElement,
  type KritzelBaseObject,
  type KritzelSyncConfig,
} from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import {
  buttonStyle,
  editorStyle,
  hostStyle,
  toolbarStyle,
} from "../../shared/demo-shared";

interface WorkspacePalette {
  fill: string;
  stroke: string;
  accent: string;
}

const themes = [reactThemeLight, reactThemeDark];
const syncConfig: KritzelSyncConfig = {
  providers: [InMemorySyncProvider],
};
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

function createWorkspaceObjects(palette: WorkspacePalette): KritzelBaseObject[] {
  return [
    new KritzelShape({
      translateX: -140,
      translateY: -170,
      width: 120,
      height: 120,
      shapeType: ShapeType.Ellipse,
      fillColor: { light: palette.fill, dark: palette.fill },
      strokeColor: { light: palette.stroke, dark: palette.stroke },
      strokeWidth: 3,
    }),
    new KritzelShape({
      translateX: 20,
      translateY: -150,
      width: 120,
      height: 120,
      shapeType: ShapeType.Rectangle,
      fillColor: { light: palette.fill, dark: palette.fill },
      strokeColor: { light: palette.accent, dark: palette.accent },
      strokeWidth: 3,
    }),
    new KritzelLine({
      startX: -170,
      startY: 10,
      endX: 130,
      endY: 10,
      stroke: { light: palette.accent, dark: palette.accent },
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
      fill: { light: palette.stroke, dark: palette.stroke },
    }),
  ];
}

function createInitialWorkspaces() {
  return [
    new KritzelWorkspace({ id: "coral", name: "Coral", objects: createWorkspaceObjects({ fill: "#fce4ec", stroke: "#c62828", accent: "#ff9800" }) }),
    new KritzelWorkspace({ id: "ocean", name: "Ocean", objects: createWorkspaceObjects({ fill: "#e3f2fd", stroke: "#1565c0", accent: "#00bcd4" }) }),
    new KritzelWorkspace({ id: "violet", name: "Violet", objects: createWorkspaceObjects({ fill: "#f3e5f5", stroke: "#6a1b9a", accent: "#e91e63" }) }),
    new KritzelWorkspace({ id: "meadow", name: "Meadow", objects: createWorkspaceObjects({ fill: "#e8f5e9", stroke: "#2e7d32", accent: "#8bc34a" }) }),
    new KritzelWorkspace({ id: "amber", name: "Amber", objects: createWorkspaceObjects({ fill: "#fff3e0", stroke: "#ef6c00", accent: "#795548" }) }),
    new KritzelWorkspace({ id: "lagoon", name: "Lagoon", objects: createWorkspaceObjects({ fill: "#e0f7fa", stroke: "#00838f", accent: "#3f51b5" }) }),
  ];
}

export function WorkspacesSwitchPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [workspaces] = useState(createInitialWorkspaces);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | undefined>(
    "coral",
  );

  function onActiveWorkspaceChange(
    event: CustomEvent<ActiveWorkspaceChangeEvent>,
  ) {
    setActiveWorkspaceId(event.detail.id);
  }

  async function switchTo(workspace: KritzelWorkspace) {
    await editorRef.current?.setActiveWorkspace(workspace.id);
  }

  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null;
  const activeWorkspaceJson = activeWorkspace
    ? JSON.stringify(
        {
          ...activeWorkspace.serialize(),
          objects:
            activeWorkspace.objects?.map((object) => object.serialize()) ?? [],
        },
        null,
        2,
      )
    : "";

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        {workspaces.map((workspace) => (
          <button
            key={workspace.id}
            style={buttonStyle(activeWorkspaceId === workspace.id)}
            onClick={() => void switchTo(workspace)}
          >
            {workspace.name}
          </button>
        ))}
      </div>
      <div style={contentStyle}>
        <KritzelEditor
          ref={editorRef}
          editorId="workspaces-switch"
          theme="light"
          themes={themes}
          syncConfig={syncConfig}
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          loginConfig={undefined}
          isPanningEnabled={false}
          isZoomingEnabled={false}
          isMoreMenuVisible={false}
          isWorkspaceManagerVisible={false}
          onActiveWorkspaceChange={onActiveWorkspaceChange}
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
