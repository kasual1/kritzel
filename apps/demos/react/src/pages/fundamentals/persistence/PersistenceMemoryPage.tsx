import { useRef, useState } from "react";
import {
  InMemorySyncProvider,
  UpdrawEditor,
  UpdrawWorkspace,
  type ActiveWorkspaceChangeEvent,
  type HTMLUpdrawEditorElement,
  type UpdrawSyncConfig,
} from "@updraw/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { createSeedObjects } from "../../getting-started/seed-objects";
import {
  editorStyle,
  hostStyle,
} from "../../shared/demo-shared";
import { Toolbar } from "../../../components/Toolbar";

const themes = [reactThemeLight, reactThemeDark];
const syncConfig: UpdrawSyncConfig = {
  providers: [InMemorySyncProvider],
};

function createInitialWorkspaces() {
  return ["Board 1", "Board 2", "Board 3"].map(
    (name, index) =>
      new UpdrawWorkspace({
        id: `board-${index + 1}`,
        name,
        objects: createSeedObjects(),
      }),
  );
}

export function PersistenceMemoryPage() {
  const editorRef = useRef<HTMLUpdrawEditorElement | null>(null);
  const [workspaces] = useState(createInitialWorkspaces);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | undefined>(
    "board-1",
  );

  function onActiveWorkspaceChange(
    event: CustomEvent<ActiveWorkspaceChangeEvent>,
  ) {
    setActiveWorkspaceId(event.detail.id);
  }

  async function switchTo(workspace: UpdrawWorkspace) {
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
      <UpdrawEditor
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