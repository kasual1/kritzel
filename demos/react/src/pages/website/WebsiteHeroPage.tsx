import { CSSProperties, useEffect, useRef } from "react";
import { KritzelEditor, type HTMLKritzelEditorElement } from "kritzel-react";
import {
  setupImageStackRenderer,
} from "./custom-elements/imageStackCustomElement";
import {
  setupRocketTodoRenderer,
} from "./custom-elements/rocketTodoCustomElement";

const INITIAL_WORKSPACE_EXPORT_URL = encodeURI("/New Workspace-2026-07-24T16-40-54.json");

const hostStyle: CSSProperties = {
  display: "block",
  height: "100%",
};

export function WebsiteHeroPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const hasImportedInitialWorkspace = useRef(false);

  useEffect(() => {
    const cleanupRocketTodoRenderer = setupRocketTodoRenderer();
    const cleanupImageStackRenderer = setupImageStackRenderer();

    return () => {
      cleanupRocketTodoRenderer();
      cleanupImageStackRenderer();
    };
  }, []);

  async function onReady() {
    if (hasImportedInitialWorkspace.current) {
      return;
    }

    const objectCount = await editorRef.current?.getObjectsTotalCount();
    if ((objectCount ?? 0) > 0) {
      return;
    }

    const response = await fetch(INITIAL_WORKSPACE_EXPORT_URL);
    if (!response.ok) {
      throw new Error(`Failed to load initial workspace export: ${response.status} ${response.statusText}`);
    }

    const workspaceJson = await response.text();
    const importedWorkspace = JSON.parse(workspaceJson) as {
      viewport?: {
        centerWorldX: number;
        centerWorldY: number;
        scale: number;
      };
    };

    await editorRef.current?.loadObjectsFromJson(workspaceJson);

    if (importedWorkspace.viewport) {
      await editorRef.current?.setViewport(
        importedWorkspace.viewport.centerWorldX,
        importedWorkspace.viewport.centerWorldY,
        importedWorkspace.viewport.scale,
      );
    }

    hasImportedInitialWorkspace.current = true;
  }

  return (
    <div style={hostStyle}>
      <KritzelEditor
        ref={editorRef}
        editorId="website-hero"
        isPanningEnabled={true}
        isZoomingEnabled={true}
        isMoreMenuVisible={true}
        isWorkspaceManagerVisible={false}
        onIsReady={() => {
          void onReady();
        }}
      />
    </div>
  );
}
