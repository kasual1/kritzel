import { useRef, useState } from "react";
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

function createInitialWorkspaces() {
  return [
    new KritzelWorkspace({
      id: "board-1",
      name: "Board 1",
      objects: createSeedObjects(),
    }),
  ];
}

export function WorkspacesCreatePage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [workspaces, setWorkspaces] = useState(createInitialWorkspaces);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | undefined>(
    "board-1",
  );

  function onActiveWorkspaceChange(
    event: CustomEvent<ActiveWorkspaceChangeEvent>,
  ) {
    setActiveWorkspaceId(event.detail.id);
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
      <KritzelEditor
        ref={editorRef}
        editorId="workspaces-create"
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
    </div>
  );
}