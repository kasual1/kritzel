import "@google/model-viewer";
import { KritzelCustomElement } from "kritzel-react";
import { KritzelCustomElementRendererRegistry } from "kritzel-stencil";

export const THREE_D_MODEL_VIEWER_RENDERER_KEY = "website-hero-3d-model-viewer";
const THREE_D_MODEL_VIEWER_Z_INDEX = 11;
const THREE_D_MODEL_VIEWER_WIDTH = 360;
const THREE_D_MODEL_VIEWER_HEIGHT = 260;

const normalizedBaseUrl = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

function withBaseUrl(assetPath: string): string {
  return `${normalizedBaseUrl}${assetPath.replace(/^\/+/, "")}`;
}

type ThreeDModelViewerState = {
  schemaVersion: 1;
};

type MountedThreeDModelViewer = {
  root: HTMLElement;
  getState: () => ThreeDModelViewerState;
  destroy: () => void;
};

export function createThreeDModelViewerInitialState(): ThreeDModelViewerState {
  return {
    schemaVersion: 1,
  };
}

function normalizeThreeDModelViewerState(data: unknown): ThreeDModelViewerState {
  if (!data || typeof data !== "object") {
    return createThreeDModelViewerInitialState();
  }

  const candidate = data as Partial<ThreeDModelViewerState>;
  if (candidate.schemaVersion !== 1) {
    return createThreeDModelViewerInitialState();
  }

  return {
    schemaVersion: 1,
  };
}

function mountThreeDModelViewerWidget(
  initialState: ThreeDModelViewerState,
): MountedThreeDModelViewer {
  const state = normalizeThreeDModelViewerState(initialState);
  const modelUrl = withBaseUrl("orion_capsule.gltf");

  const root = document.createElement("section");
  root.style.cssText = [
    "height:100%",
    "width:100%",
    "box-sizing:border-box",
    "border:4.4px solid #e4e7eb",
    "border-radius:5.5px",
    "background:#06080c",
    "display:block",
    "overflow:hidden",
  ].join(";");

  const modelViewer = document.createElement("model-viewer");
  modelViewer.setAttribute("src", modelUrl);
  modelViewer.setAttribute("alt", "Orion spacecraft 3D model");
  modelViewer.setAttribute("camera-controls", "");
  modelViewer.setAttribute("disable-zoom", "");
  modelViewer.setAttribute("interaction-prompt", "none");
  modelViewer.setAttribute("auto-rotate", "");
  modelViewer.setAttribute("auto-rotate-delay", "0");
  modelViewer.setAttribute("rotation-per-second", "8deg");
  modelViewer.setAttribute("shadow-intensity", "1");
  modelViewer.setAttribute("exposure", "1");
  modelViewer.style.cssText = "display:block; width:100%; height:100%; pointer-events:none;";

  root.appendChild(modelViewer);

  return {
    root,
    getState: () => ({ schemaVersion: state.schemaVersion }),
    destroy: () => {
      // No subscriptions are attached for this static viewer.
    },
  };
}

export function setupThreeDModelViewerRenderer() {
  const mountedWidgets = new Map<string, MountedThreeDModelViewer>();

  KritzelCustomElementRendererRegistry.register(THREE_D_MODEL_VIEWER_RENDERER_KEY, {
    onMount: ({ object, container, data }) => {
      if (!container) {
        return;
      }

      object.isResizable = true;
      object.isRotatable = false;
      object.zIndex = THREE_D_MODEL_VIEWER_Z_INDEX;

      const previousWidget = mountedWidgets.get(object.id);
      if (previousWidget) {
        previousWidget.destroy();
        previousWidget.root.remove();
        mountedWidgets.delete(object.id);
      }

      const mountedWidget = mountThreeDModelViewerWidget(normalizeThreeDModelViewerState(data));
      container.innerHTML = "";
      container.appendChild(mountedWidget.root);
      requestAnimationFrame(() => {
        const objectElement = container.closest<HTMLElement>(".object");
        if (objectElement) {
          objectElement.style.zIndex = `${THREE_D_MODEL_VIEWER_Z_INDEX}`;
        }
      });

      object.setIsInteractive(true);
      mountedWidgets.set(object.id, mountedWidget);
    },
    onUnmount: ({ object, container }) => {
      const mountedWidget = mountedWidgets.get(object.id);
      if (!mountedWidget) {
        return undefined;
      }

      const snapshot = mountedWidget.getState();
      mountedWidget.destroy();
      mountedWidget.root.remove();
      mountedWidgets.delete(object.id);

      if (container) {
        container.innerHTML = "";
      }

      return snapshot;
    },
  });

  return () => {
    mountedWidgets.forEach((widget) => {
      widget.destroy();
      widget.root.remove();
    });
    mountedWidgets.clear();
    KritzelCustomElementRendererRegistry.unregister(THREE_D_MODEL_VIEWER_RENDERER_KEY);
  };
}

export function createThreeDModelViewerCustomElement() {
  const placeholder = document.createElement("div");
  placeholder.textContent = "Loading 3D model...";

  const customElement = new KritzelCustomElement({
    element: placeholder,
    rendererKey: THREE_D_MODEL_VIEWER_RENDERER_KEY,
    rendererData: createThreeDModelViewerInitialState(),
    translateX: 1080,
    translateY: -200,
    width: THREE_D_MODEL_VIEWER_WIDTH,
    height: THREE_D_MODEL_VIEWER_HEIGHT,
  });

  customElement.isRotatable = false;
  customElement.isResizable = true;
  customElement.zIndex = THREE_D_MODEL_VIEWER_Z_INDEX;

  return customElement;
}
