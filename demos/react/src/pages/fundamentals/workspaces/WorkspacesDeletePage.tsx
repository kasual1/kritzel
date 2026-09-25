import { useRef, useState, type CSSProperties, type MouseEvent } from "react";
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
import { editorStyle, hostStyle, toolbarStyle } from "../../shared/demo-shared";

const themes = [reactThemeLight, reactThemeDark];
const syncConfig: KritzelSyncConfig = {
  providers: [InMemorySyncProvider],
};
const tabStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  border: "1px solid #cccccc",
  borderRadius: "4px",
  background: "#ffffff",
  overflow: "hidden",
  fontSize: "13px",
};
const workspaceButtonStyle: CSSProperties = {
  padding: "6px 10px",
  border: 0,
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
};
const deleteButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "14px",
  height: "14px",
  marginRight: "8px",
  padding: 0,
  border: 0,
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
  fontWeight: 700,
};

function createInitialWorkspaces() {
  return Array.from(
    { length: 6 },
    (_, index) =>
      new KritzelWorkspace({
        id: `board-${index + 1}`,
        name: `Board ${index + 1}`,
        objects: createSeedObjects(),
      }),
  );
}

export function WorkspacesDeletePage() {
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

  async function switchTo(workspace: KritzelWorkspace) {
    await editorRef.current?.setActiveWorkspace(workspace.id);
  }

  async function deleteWorkspace(
    workspace: KritzelWorkspace,
    event: MouseEvent<HTMLButtonElement>,
  ) {
    event.stopPropagation();
    const editor = editorRef.current;
    if (!editor || workspaces.length <= 1) return;

    const remainingWorkspaces = workspaces.filter(
      (candidate) => candidate.id !== workspace.id,
    );
    const shouldSelectFirstWorkspace = workspace.id === activeWorkspaceId;

    await editor.deleteWorkspace(workspace);
    setWorkspaces(remainingWorkspaces);

    if (shouldSelectFirstWorkspace) {
      const firstWorkspace = remainingWorkspaces[0];
      setActiveWorkspaceId(firstWorkspace.id);
      await editor.setActiveWorkspace(firstWorkspace.id);
    }
  }

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        {workspaces.map((workspace) => {
          const isActive = workspace.id === activeWorkspaceId;
          return (
            <div
              key={workspace.id}
              style={{
                ...tabStyle,
                borderColor: isActive ? "#087ea4" : "#cccccc",
                background: isActive ? "#087ea4" : "#ffffff",
                color: isActive ? "#ffffff" : "#333333",
              }}
            >
              <button
                type="button"
                style={workspaceButtonStyle}
                onClick={() => void switchTo(workspace)}
              >
                {workspace.name}
              </button>
              {workspaces.length > 1 && (
                <button
                  type="button"
                  aria-label={`Delete ${workspace.name}`}
                  style={deleteButtonStyle}
                  onClick={(event) => void deleteWorkspace(workspace, event)}
                >
                  X
                </button>
              )}
            </div>
          );
        })}
      </div>
      <KritzelEditor
        ref={editorRef}
        editorId="workspaces-delete"
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