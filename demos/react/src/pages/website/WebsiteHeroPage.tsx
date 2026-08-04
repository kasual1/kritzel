import { CSSProperties, useEffect, useRef } from "react";
import {
  DEFAULT_BRUSH_CONFIG,
  DEFAULT_TEXT_CONFIG,
  KritzelBrushTool,
  KritzelEditor,
  KritzelEraserTool,
  KritzelImageTool,
  KritzelLineTool,
  KritzelSelectionTool,
  KritzelShapeTool,
  ShapeType,
  KritzelTextTool,
  type HTMLKritzelEditorElement,
  type KritzelToolbarControl,
  type KritzelViewportState,
} from "kritzel-react";
import {
  setupImageStackRenderer,
} from "./custom-elements/imageStackCustomElement";
import {
  setupRocketTodoRenderer,
} from "./custom-elements/rocketTodoCustomElement";
import {
  setupCoreStageDashboardRenderer,
} from "./custom-elements/coreStageDashboardCustomElement";
import {
  VIDEO_RENDERER_KEY,
  createVideoCustomElement,
  setupVideoRenderer,
} from "./custom-elements/videoCustomElement";
import {
  preloadThreeDModelViewerAssets,
  THREE_D_MODEL_VIEWER_RENDERER_KEY,
  createThreeDModelViewerCustomElement,
  setupThreeDModelViewerRenderer,
} from "./custom-elements/threeDModelViewerCustomElement";
import { registerHeroServiceWorker } from "./registerHeroServiceWorker";

const normalizedBaseUrl = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;
const INITIAL_WORKSPACE_EXPORT_URL = `${normalizedBaseUrl}hero_workspace.json`;
const RACING_SANS_ONE_STYLESHEET_URL = "https://fonts.googleapis.com/css2?family=Racing+Sans+One&display=swap";

type ImportedWorkspaceViewport = {
  centerWorldX: number;
  centerWorldY: number;
  scale: number;
};

type InitialWorkspacePayload = {
  workspaceJson: string;
  viewport?: ImportedWorkspaceViewport;
};

let initialWorkspacePayloadPromise: Promise<InitialWorkspacePayload> | null = null;

function loadInitialWorkspacePayload(): Promise<InitialWorkspacePayload> {
  if (initialWorkspacePayloadPromise) {
    return initialWorkspacePayloadPromise;
  }

  initialWorkspacePayloadPromise = fetch(INITIAL_WORKSPACE_EXPORT_URL)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to load initial workspace export: ${response.status} ${response.statusText}`);
      }

      const workspaceJson = await response.text();
      const importedWorkspace = JSON.parse(workspaceJson) as {
        viewport?: ImportedWorkspaceViewport;
      };

      return {
        workspaceJson,
        viewport: importedWorkspace.viewport,
      };
    })
    .catch((error: unknown) => {
      // Allow retry if the first prefetch fails.
      initialWorkspacePayloadPromise = null;
      throw error;
    });

  return initialWorkspacePayloadPromise;
}

const WEBSITE_HERO_CUSTOM_FONTS = {
  "website-hero-racing-sans-one": {
    family: "Racing Sans One",
    label: "Racing Sans One",
    cssFontFamily: "'Racing Sans One', sans-serif",
    source: RACING_SANS_ONE_STYLESHEET_URL,
  },
};

const WEBSITE_HERO_TEXT_TOOL_CONFIG = {
  ...DEFAULT_TEXT_CONFIG,
  availableFonts: [
    ...(DEFAULT_TEXT_CONFIG.availableFonts ?? []),
    {
      family: "Racing Sans One",
      label: "Racing Sans One",
      cssFontFamily: "'Racing Sans One', sans-serif",
      source: RACING_SANS_ONE_STYLESHEET_URL,
    },
  ],
};

const WEBSITE_HERO_LINE_TOOL_CONFIG = {
  color: { light: "#000000", dark: "#ffffff" },
  size: 4,
  opacity: 1,
  palette: [
    { light: "#000000", dark: "#ffffff" },
    { light: "#ffffff", dark: "#000000" },
    { light: "#ef4444", dark: "#ef4444" },
    { light: "#22c55e", dark: "#22c55e" },
    { light: "#3b82f6", dark: "#3b82f6" },
    { light: "#f59e0b", dark: "#f59e0b" },
    { light: "#a855f7", dark: "#a855f7" },
  ],
  sizes: [4, 6, 8, 12, 16, 24],
  arrows: {
    end: { enabled: true, style: "triangle" as const },
  },
};

const WEBSITE_HERO_SHAPE_TOOL_CONFIG = {
  shapeType: ShapeType.Rectangle,
  fillColor: { light: "transparent", dark: "transparent" },
  strokeColor: { light: "#000000", dark: "#ffffff" },
  strokeWidth: 4,
  opacity: 1,
  fontColor: { light: "#000000", dark: "#ffffff" },
  fontSize: 16,
  fontFamily: "Arial",
  palette: [
    { light: "#000000", dark: "#ffffff" },
    { light: "#ffffff", dark: "#000000" },
    { light: "#ef4444", dark: "#ef4444" },
    { light: "#22c55e", dark: "#22c55e" },
    { light: "#3b82f6", dark: "#3b82f6" },
    { light: "#f59e0b", dark: "#f59e0b" },
    { light: "#a855f7", dark: "#a855f7" },
  ],
  sizes: [4, 6, 8, 12, 16, 24],
};

const WEBSITE_HERO_CONTROLS: KritzelToolbarControl[] = [
  {
    name: "selection",
    type: "tool",
    isDefault: true,
    tool: KritzelSelectionTool,
    icon: "cursor",
  },
  {
    name: "brush",
    type: "tool",
    tool: KritzelBrushTool,
    icon: "pen",
    config: DEFAULT_BRUSH_CONFIG,
  },
  {
    name: "eraser",
    type: "tool",
    tool: KritzelEraserTool,
    icon: "eraser",
  },
  {
    name: "line",
    type: "tool",
    tool: KritzelLineTool,
    icon: "arrow",
    config: WEBSITE_HERO_LINE_TOOL_CONFIG,
  },
  {
    name: "shape",
    type: "tool",
    tool: KritzelShapeTool,
    icon: "shape-rectangle",
    config: WEBSITE_HERO_SHAPE_TOOL_CONFIG,
    subOptions: [
      { id: "rectangle", icon: "shape-rectangle", label: "Rectangle", value: ShapeType.Rectangle, toolProperty: "shapeType" },
      { id: "ellipse", icon: "shape-ellipse", label: "Ellipse", value: ShapeType.Ellipse, toolProperty: "shapeType" },
      { id: "triangle", icon: "shape-triangle", label: "Triangle", value: ShapeType.Triangle, toolProperty: "shapeType" },
    ],
  },
  {
    name: "text",
    type: "tool",
    tool: KritzelTextTool,
    icon: "type",
    config: WEBSITE_HERO_TEXT_TOOL_CONFIG,
  },
  {
    name: "image",
    type: "tool",
    tool: KritzelImageTool,
    icon: "image",
  },
  {
    name: "config",
    type: "config",
  },
];

const hostStyle: CSSProperties = {
  display: "block",
  height: "100%",
  position: "relative",
  overflow: "hidden",
  backgroundColor: "#ffffff",
};

const editorWrapperBaseStyle: CSSProperties = {
  height: "100%",
};

export function WebsiteHeroPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const hasImportedInitialWorkspace = useRef(false);
  const hasAddedVideoCustomElement = useRef(false);
  const hasAddedThreeDModelViewerCustomElement = useRef(false);
  const isEditorReady = useRef(false);
  const lastViewportSize = useRef<{ width: number; height: number } | null>(null);
  const fitAnimationFrameId = useRef<number | null>(null);
  const isAutoCentering = useRef(false);
  const hasPendingAutoCenter = useRef(false);

  async function centerAllObjectsNow() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    if (isAutoCentering.current) {
      hasPendingAutoCenter.current = true;
      return;
    }

    isAutoCentering.current = true;

    try {
      await editor.centerAllObjects(false);
    } finally {
      isAutoCentering.current = false;

      if (hasPendingAutoCenter.current) {
        hasPendingAutoCenter.current = false;
        await centerAllObjectsNow();
      }
    }
  }

  useEffect(() => {
    registerHeroServiceWorker();
    void loadInitialWorkspacePayload();
    void preloadThreeDModelViewerAssets();

    const cleanupRocketTodoRenderer = setupRocketTodoRenderer();
    const cleanupImageStackRenderer = setupImageStackRenderer();
    const cleanupCoreStageDashboardRenderer = setupCoreStageDashboardRenderer();
    const cleanupVideoRenderer = setupVideoRenderer();
    const cleanupThreeDModelViewerRenderer = setupThreeDModelViewerRenderer();

    return () => {
      cleanupRocketTodoRenderer();
      cleanupImageStackRenderer();
      cleanupCoreStageDashboardRenderer();
      cleanupVideoRenderer();
      cleanupThreeDModelViewerRenderer();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (fitAnimationFrameId.current !== null) {
        cancelAnimationFrame(fitAnimationFrameId.current);
        fitAnimationFrameId.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const hostElement = hostRef.current;
    if (!hostElement || typeof ResizeObserver === "undefined") {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      if (!isEditorReady.current) {
        return;
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(async () => {
          const viewport = await editorRef.current?.getViewport();
          if (!viewport) {
            return;
          }

          const previousSize = lastViewportSize.current;
          lastViewportSize.current = { width: viewport.width, height: viewport.height };

          if (!previousSize || previousSize.width !== viewport.width || previousSize.height !== viewport.height) {
            scheduleCenterAllObjects();
          }
        });
      });
    });

    resizeObserver.observe(hostElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  function scheduleCenterAllObjects() {
    if (!isEditorReady.current) {
      return;
    }

    if (fitAnimationFrameId.current !== null) {
      cancelAnimationFrame(fitAnimationFrameId.current);
    }

    fitAnimationFrameId.current = requestAnimationFrame(() => {
      fitAnimationFrameId.current = null;
      const editor = editorRef.current;
      if (!editor) {
        return;
      }

      void centerAllObjectsNow();
    });
  }

  function onViewportChange(viewport: KritzelViewportState) {
    const previousSize = lastViewportSize.current;
    lastViewportSize.current = { width: viewport.width, height: viewport.height };

    if (!isEditorReady.current || !previousSize) {
      return;
    }

    // Only refit on actual size changes to avoid loops from pan/zoom events.
    if (previousSize.width === viewport.width && previousSize.height === viewport.height) {
      return;
    }

    scheduleCenterAllObjects();
  }

  async function onReady() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    async function ensureVideoCustomElementObject(editorElement: HTMLKritzelEditorElement) {
      if (hasAddedVideoCustomElement.current) {
        return;
      }

      const objects = await editorElement.getAllObjects();
      const hasExistingVideo = objects.some((object) => {
        if (!object || typeof object !== "object") {
          return false;
        }

        const candidate = object as { __class__?: string; rendererKey?: string };
        return (
          candidate.__class__ === "KritzelCustomElement" &&
          candidate.rendererKey === VIDEO_RENDERER_KEY
        );
      });

      if (hasExistingVideo) {
        hasAddedVideoCustomElement.current = true;
        return;
      }

      await editorElement.addObject(createVideoCustomElement());
      hasAddedVideoCustomElement.current = true;
    }

    async function ensureThreeDModelViewerCustomElementObject(editorElement: HTMLKritzelEditorElement) {
      if (hasAddedThreeDModelViewerCustomElement.current) {
        return;
      }

      const objects = await editorElement.getAllObjects();
      const hasExistingModelViewer = objects.some((object) => {
        if (!object || typeof object !== "object") {
          return false;
        }

        const candidate = object as { __class__?: string; rendererKey?: string };
        return (
          candidate.__class__ === "KritzelCustomElement" &&
          candidate.rendererKey === THREE_D_MODEL_VIEWER_RENDERER_KEY
        );
      });

      if (hasExistingModelViewer) {
        hasAddedThreeDModelViewerCustomElement.current = true;
        return;
      }

      await editorElement.addObject(createThreeDModelViewerCustomElement());
      hasAddedThreeDModelViewerCustomElement.current = true;
    }

    if (hasImportedInitialWorkspace.current) {
      await ensureVideoCustomElementObject(editor);
      await ensureThreeDModelViewerCustomElementObject(editor);
      const currentViewport = await editor.getViewport();
      lastViewportSize.current = { width: currentViewport.width, height: currentViewport.height };
      isEditorReady.current = true;
      await centerAllObjectsNow();
      return;
    }

    const objectCount = await editor.getObjectsTotalCount();
    if ((objectCount ?? 0) > 0) {
      await ensureVideoCustomElementObject(editor);
      await ensureThreeDModelViewerCustomElementObject(editor);
      hasImportedInitialWorkspace.current = true;
      const currentViewport = await editor.getViewport();
      lastViewportSize.current = { width: currentViewport.width, height: currentViewport.height };
      isEditorReady.current = true;
      await centerAllObjectsNow();
      return;
    }

    const { workspaceJson, viewport } = await loadInitialWorkspacePayload();

    await editor.loadObjectsFromJson(workspaceJson);

    if (viewport) {
      await editor.setViewport(
        viewport.centerWorldX,
        viewport.centerWorldY,
        viewport.scale,
      );
    }

    await ensureVideoCustomElementObject(editor);
    await ensureThreeDModelViewerCustomElementObject(editor);

    hasImportedInitialWorkspace.current = true;
    const currentViewport = await editor.getViewport();
    lastViewportSize.current = { width: currentViewport.width, height: currentViewport.height };
    isEditorReady.current = true;
    await centerAllObjectsNow();
  }

  return (
    <div ref={hostRef} style={hostStyle}>
      <div style={editorWrapperBaseStyle}>
        <KritzelEditor
          ref={editorRef}
          editorId="website-hero"
          customFonts={WEBSITE_HERO_CUSTOM_FONTS}
          controls={WEBSITE_HERO_CONTROLS}
          isPanningEnabled={false}
          isZoomingEnabled={true}
          isMoreMenuVisible={true}
          isWorkspaceManagerVisible={true}
          onIsReady={() => {
            void onReady();
          }}
          onViewportChange={(event) => {
            onViewportChange((event as CustomEvent<KritzelViewportState>).detail);
          }}
        />
      </div>
    </div>
  );
}
