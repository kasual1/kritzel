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
  return ["Board 1", "Board 2", "Board 3"].map(
    (name, index) =>
      new UpmadeWorkspace({
        id: `board-${index + 1}`,
        name,
        objects: createSeedObjects(),
      }),
  );
}

export function PersistenceMemoryPage() {
  const editorRef = useRef<HTMLUpmadeEditorElement | null>(null);
  const [workspaces] = useState(createInitialWorkspaces);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | undefined>(
    "board-1",
  );

  function onActiveWorkspaceChange(
    event: CustomEvent<ActiveWorkspaceChangeEvent>,
  ) {
    setActiveWorkspaceId(event.detail.id);
  }

  async function switchTo(workspace: UpmadeWorkspace) {
    await editorRef.current?.setActiveWorkspace(workspace.id);
  }

  return (
    <div
      style={{
        ...hostStyle,
        background: "linear-gradient(180deg, #f3fbff 0%, #ffffff 100%)",
      }}
    >
      <Toolbar>
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
        editorId="persistence-memory"
        syncConfig={syncConfig}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        theme="light"
        themes={themes}
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