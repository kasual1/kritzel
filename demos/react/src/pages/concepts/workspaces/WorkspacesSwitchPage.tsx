import { useMemo, useRef, useState } from "react";
import {
  InMemorySyncProvider,
  KritzelEditor,
  type ActiveWorkspaceChangeEvent,
  HTMLKritzelEditorElement,
  type KritzelSyncConfig,
  type KritzelWorkspace,
} from "kritzel-react";
import { reactThemeLight } from "../../../const/react-theme-light";
import {
  buttonStyle,
  editorStyle,
  hostStyle,
  seedEditor,
  toolbarStyle,
} from "../shared/concept-shared";

export function WorkspacesSwitchPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [workspaces, setWorkspaces] = useState<KritzelWorkspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | undefined>(undefined);
  const syncConfig = useMemo<KritzelSyncConfig>(
    () => ({ providers: [InMemorySyncProvider] }),
    [],
  );

  async function onReady(event: CustomEvent<{ activeWorkspace: KritzelWorkspace }>) {
    if (!editorRef.current) {
      return;
    }

    setWorkspaces((await editorRef.current.getWorkspaces()) as KritzelWorkspace[]);
    setActiveWorkspaceId(event.detail.activeWorkspace.id);
    await seedEditor(editorRef.current);
  }

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        {workspaces.map((workspace) => (
          <button
            key={workspace.id}
            style={buttonStyle(activeWorkspaceId === workspace.id)}
            onClick={() => setActiveWorkspaceId(workspace.id)}
          >
            {workspace.name}
          </button>
        ))}
      </div>
      <KritzelEditor
        ref={editorRef}
        editorId="workspaces-switch"
        theme="light"
        themes={[reactThemeLight]}
        syncConfig={syncConfig}
        activeWorkspaceId={activeWorkspaceId}
        isPanningEnabled={false}
        isZoomingEnabled={false}
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
