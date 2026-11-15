import { useRef, useState } from "react";
import {
  InMemorySyncProvider,
  UpmadeEditor,
  UpmadeWorkspace,
  type ActiveWorkspaceChangeEvent,
  type HTMLUpmadeEditorElement,
  type UpmadeSyncConfig,
} from "@upmade/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { createSeedObjects } from "../../getting-started/seed-objects";
import {
  editorStyle,
  hostStyle,
} from "../../shared/demo-shared";
import { Toolbar } from "../../../components/Toolbar";

const themes = [reactThemeLight, reactThemeDark];
const syncConfig: UpmadeSyncConfig = {
  providers: [InMemorySyncProvider],
};

function createInitialWorkspaces() {
  return [
    new UpmadeWorkspace({
      id: "board-1",
      name: "Board 1",
      objects: createSeedObjects(),
    }),
  ];
}

export function WorkspacesCreatePage() {
  const editorRef = useRef<HTMLUpmadeEditorElement | null>(null);
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
      new UpmadeWorkspace({
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

  async function switchTo(workspace: UpmadeWorkspace) {
    await editorRef.current?.setActiveWorkspace(workspace.id);
  }

  return (
    <div style={hostStyle}>
      <Toolbar>
        <button onClick={() => void addWorkspace()}>
          Add Workspace
        </button>
        {workspaces.map((workspace) => (
          <button
            key={workspace.id}
            className={workspace.id === activeWorkspaceId ? "active" : undefined}
            onClick={() => void switchTo(workspace)}
          >
            {workspace.name}
          </button>
        ))}
      </Toolbar>
      <UpmadeEditor
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