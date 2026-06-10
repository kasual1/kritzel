import { useMemo, useRef, useState } from "react";
import {
  InMemorySyncProvider,
  KritzelEditor,
  KritzelWorkspace,
  type ActiveWorkspaceChangeEvent,
  type HTMLKritzelEditorElement,
  type KritzelSyncConfig,
} from "kritzel-react";
import { customReactTheme } from "../../../const/custom-react-theme";
import {
  editorStyle,
  hostStyle,
  seedEditor,
  toolbarStyle,
} from "../shared/concept-shared";

export function WorkspacesCrudPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [workspaces, setWorkspaces] = useState<KritzelWorkspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | undefined>(undefined);
  const [workspaceCounter, setWorkspaceCounter] = useState(1);
  const syncConfig = useMemo<KritzelSyncConfig>(
    () => ({ providers: [InMemorySyncProvider] }),
    [],
  );

  async function refreshWorkspaces() {
    setWorkspaces(((await editorRef.current?.getWorkspaces()) ?? []) as KritzelWorkspace[]);
  }

  async function onReady(event: CustomEvent<{ activeWorkspace: KritzelWorkspace }>) {
    if (!editorRef.current) {
      return;
    }

    await refreshWorkspaces();
    setActiveWorkspaceId(event.detail.activeWorkspace.id);
    await seedEditor(editorRef.current);
  }

  async function createWorkspace() {
    const nextCounter = workspaceCounter + 1;
    setWorkspaceCounter(nextCounter);

    const workspace = new KritzelWorkspace(crypto.randomUUID(), `Board ${nextCounter}`);
    await editorRef.current?.createWorkspace(workspace);
    await refreshWorkspaces();
    setActiveWorkspaceId(workspace.id);
  }

  async function deleteWorkspace(workspace: KritzelWorkspace) {
    const wasActive = workspace.id === activeWorkspaceId;
    await editorRef.current?.deleteWorkspace(workspace);
    const remaining = ((await editorRef.current?.getWorkspaces()) ?? []) as KritzelWorkspace[];
    setWorkspaces(remaining);

    if (wasActive && remaining[0]) {
      setActiveWorkspaceId(remaining[0].id);
    }
  }

  return (
    <div style={hostStyle}>
      <div style={{ ...toolbarStyle, gap: "4px", overflowX: "auto" }}>
        {workspaces.map((workspace) => (
          <div key={workspace.id} style={{ display: "flex", border: `1px solid ${workspace.id === activeWorkspaceId ? "#087ea4" : "#ccc"}`, borderRadius: "6px", overflow: "hidden" }}>
            <button
              style={{
                border: "none",
                padding: "6px 8px",
                cursor: "pointer",
                background: workspace.id === activeWorkspaceId ? "#087ea4" : "#fff",
                color: workspace.id === activeWorkspaceId ? "#fff" : "#333",
              }}
              onClick={() => setActiveWorkspaceId(workspace.id)}
            >
              {workspace.name}
            </button>
            {workspaces.length > 1 && (
              <button
                style={{ border: "none", borderLeft: "1px solid #eee", background: "#fff", padding: "4px 6px", cursor: "pointer" }}
                onClick={() => {
                  void deleteWorkspace(workspace);
                }}
              >
                X
              </button>
            )}
          </div>
        ))}
        <button style={{ padding: "6px 12px", border: "1px dashed #aaa", borderRadius: "6px", background: "transparent", cursor: "pointer" }} onClick={() => void createWorkspace()}>
          + New
        </button>
      </div>
      <KritzelEditor
        ref={editorRef}
        editorId="workspaces-crud"
        wheelEnabled={false}
        theme="react-theme"
        themes={[customReactTheme]}
        syncConfig={syncConfig}
        activeWorkspaceId={activeWorkspaceId}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        onIsReady={(event) => {
          void onReady(event as CustomEvent<{ activeWorkspace: KritzelWorkspace }>);
        }}
        onActiveWorkspaceChange={(event) => {
          const detail = (event as CustomEvent<ActiveWorkspaceChangeEvent>).detail;
          setActiveWorkspaceId(detail.id);
        }}
        style={editorStyle}
      />
    </div>
  );
}
