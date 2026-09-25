import { useRef, useState, type CSSProperties } from "react";
import {
  InMemorySyncProvider,
  KritzelEditor,
  KritzelWorkspace,
  type ActiveWorkspaceChangeEvent,
  type HTMLKritzelEditorElement,
  type KritzelSyncConfig,
} from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { createSeedObjects } from "../../getting-started/seed-objects";
import {
  buttonStyle,
  editorStyle,
  hostStyle,
  toolbarStyle,
} from "../../shared/demo-shared";

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

function createInitialWorkspaces() {
  return [
    new KritzelWorkspace({
      id: "board-1",
      name: "Board 1",
      objects: createSeedObjects(),
    }),
  ];
}

export function WorkspacesReadPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [workspaces, setWorkspaces] = useState(createInitialWorkspaces);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | undefined>(
    "board-1",
  );
  const [activeWorkspace, setActiveWorkspace] = useState<KritzelWorkspace | null>(
    null,
  );

  async function refreshActiveWorkspace() {
    setActiveWorkspace((await editorRef.current?.getActiveWorkspace()) ?? null);
  }

  async function onReady() {
    await refreshActiveWorkspace();
  }

  async function onActiveWorkspaceChange(
    event: CustomEvent<ActiveWorkspaceChangeEvent>,
  ) {
    setActiveWorkspaceId(event.detail.id);
    await refreshActiveWorkspace();
  }

  async function addWorkspace() {
    const editor = editorRef.current;
    if (!editor) return;

    const workspaceNumber = workspaces.length + 1;
    const workspace = await editor.createWorkspace(
      new KritzelWorkspace({
        id: `board-${workspaceNumber}`,
        name: `Board ${workspaceNumber}`,
        objects: createSeedObjects(),
      }),
    );

    if (workspace) {
      setWorkspaces((current) => [...current, workspace]);
      setActiveWorkspaceId(workspace.id);
      await editor.setActiveWorkspace(workspace.id);
    }
  }

  async function switchTo(workspace: KritzelWorkspace) {
    await editorRef.current?.setActiveWorkspace(workspace.id);
  }

  const activeWorkspaceJson = activeWorkspace
    ? JSON.stringify(activeWorkspace.serialize({ includeObjects: true }), null, 2)
    : "";

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        <button style={buttonStyle()} onClick={() => void addWorkspace()}>
          Add Workspace
        </button>
        {workspaces.map((workspace) => (
          <button
            key={workspace.id}
            style={buttonStyle(workspace.id === activeWorkspaceId)}
            onClick={() => void switchTo(workspace)}
          >
            {workspace.name}
          </button>
        ))}
      </div>
      <div style={contentStyle}>
        <KritzelEditor
          ref={editorRef}
          editorId="workspaces-read"
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
          onIsReady={() => void onReady()}
          onActiveWorkspaceChange={(event) =>
            void onActiveWorkspaceChange(event)
          }
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