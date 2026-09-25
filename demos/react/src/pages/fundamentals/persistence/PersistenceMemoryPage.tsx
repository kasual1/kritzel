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
  return ["Board 1", "Board 2", "Board 3"].map(
    (name, index) =>
      new KritzelWorkspace({
        id: `board-${index + 1}`,
        name,
        objects: createSeedObjects(),
      }),
  );
}

export function PersistenceMemoryPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [workspaces] = useState(createInitialWorkspaces);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | undefined>(
    "board-1",
  );

  function onActiveWorkspaceChange(
    event: CustomEvent<ActiveWorkspaceChangeEvent>,
  ) {
    setActiveWorkspaceId(event.detail.id);
  }

  async function switchTo(workspace: KritzelWorkspace) {
    await editorRef.current?.setActiveWorkspace(workspace.id);
  }

  return (
    <div
      style={{
        ...hostStyle,
        background: "linear-gradient(180deg, #f3fbff 0%, #ffffff 100%)",
      }}
    >
      <div style={toolbarStyle}>
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