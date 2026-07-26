import { CSSProperties, useEffect, useRef } from "react";
import { KritzelEditor, type HTMLKritzelEditorElement } from "kritzel-react";
import {
  setupImageStackRenderer,
} from "./custom-elements/imageStackCustomElement";
import {
  setupRocketTodoRenderer,
} from "./custom-elements/rocketTodoCustomElement";

const INITIAL_WORKSPACE_EXPORT_URL = encodeURI("/New Workspace-2026-07-25T11-57-58.json");
const RACING_SANS_ONE_STYLESHEET_URL = "https://fonts.googleapis.com/css2?family=Racing+Sans+One&display=swap";

const WEBSITE_HERO_CUSTOM_FONTS = {
  "website-hero-racing-sans-one": {
    family: "Racing Sans One",
    label: "Racing Sans One",
    cssFontFamily: "'Racing Sans One', sans-serif",
    source: RACING_SANS_ONE_STYLESHEET_URL,
  },
};

const hostStyle: CSSProperties = {
  display: "block",
  height: "100%",
};

export function WebsiteHeroPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const hasImportedInitialWorkspace = useRef(false);

  useEffect(() => {
    const linkElementId = "website-hero-racing-sans-one-font";
    let injectedLinkElement: HTMLLinkElement | null = null;

    if (!document.getElementById(linkElementId)) {
      const link = document.createElement("link");
      link.id = linkElementId;
      link.rel = "stylesheet";
      link.href = RACING_SANS_ONE_STYLESHEET_URL;
      document.head.appendChild(link);
      injectedLinkElement = link;
    }

    const cleanupRocketTodoRenderer = setupRocketTodoRenderer();
    const cleanupImageStackRenderer = setupImageStackRenderer();

    return () => {
      cleanupRocketTodoRenderer();
      cleanupImageStackRenderer();
      injectedLinkElement?.remove();
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
        customFonts={WEBSITE_HERO_CUSTOM_FONTS}
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
