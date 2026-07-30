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
  THREE_D_MODEL_VIEWER_RENDERER_KEY,
  createThreeDModelViewerCustomElement,
  setupThreeDModelViewerRenderer,
} from "./custom-elements/threeDModelViewerCustomElement";

const normalizedBaseUrl = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;
const INITIAL_WORKSPACE_EXPORT_URL = `${normalizedBaseUrl}hero_workspace.json`;
const RACING_SANS_ONE_STYLESHEET_URL = "https://fonts.googleapis.com/css2?family=Racing+Sans+One&display=swap";

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
};

export function WebsiteHeroPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const hasImportedInitialWorkspace = useRef(false);
  const hasAddedVideoCustomElement = useRef(false);
  const hasAddedThreeDModelViewerCustomElement = useRef(false);
  const isEditorReady = useRef(false);

  useEffect(() => {
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
    let animationFrameId: number | null = null;

    const fitAllObjects = () => {
      if (!isEditorReady.current) {
        return;
      }

      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        animationFrameId = null;
        void editorRef.current?.centerAllObjects(false);
      });
    };

    const hostElement = hostRef.current;
    if (hostElement && typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver(() => {
        fitAllObjects();
      });

      resizeObserver.observe(hostElement);

      return () => {
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
        }

        resizeObserver.disconnect();
      };
    }

    const onWindowResize = () => {
      fitAllObjects();
    };

    window.addEventListener("resize", onWindowResize);

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }

      window.removeEventListener("resize", onWindowResize);
    };
  }, []);

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
      isEditorReady.current = true;
      return;
    }

    const objectCount = await editor.getObjectsTotalCount();
    if ((objectCount ?? 0) > 0) {
      await ensureVideoCustomElementObject(editor);
      await ensureThreeDModelViewerCustomElementObject(editor);
      hasImportedInitialWorkspace.current = true;
      isEditorReady.current = true;
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

    await editor.loadObjectsFromJson(workspaceJson);

    if (importedWorkspace.viewport) {
      await editor.setViewport(
        importedWorkspace.viewport.centerWorldX,
        importedWorkspace.viewport.centerWorldY,
        importedWorkspace.viewport.scale,
      );
    }

    await ensureVideoCustomElementObject(editor);
    await ensureThreeDModelViewerCustomElementObject(editor);

    hasImportedInitialWorkspace.current = true;
    isEditorReady.current = true;
  }

  return (
    <div ref={hostRef} style={hostStyle}>
      <KritzelEditor
        ref={editorRef}
        editorId="website-hero"
        customFonts={WEBSITE_HERO_CUSTOM_FONTS}
        controls={WEBSITE_HERO_CONTROLS}
        isPanningEnabled={true}
        isZoomingEnabled={true}
        isMoreMenuVisible={true}
        isWorkspaceManagerVisible={true}
        onIsReady={() => {
          void onReady();
        }}
      />
    </div>
  );
}
