import { ModelViewerElement } from "@google/model-viewer";
import { KritzelCustomElement } from "kritzel-react";
import { KritzelCustomElementRendererRegistry } from "kritzel-stencil";

// <model-viewer> throttles its render resolution down to 50% whenever the page drops
// frames, and the auto-rotating scene never goes idle, so it never recovers full
// resolution. minimumRenderScale is a static class property on ModelViewerElement
// (a per-element `minimum-render-scale` attribute does not exist); pin it to 1 so the
// shared renderer always draws at full device-pixel resolution.
ModelViewerElement.minimumRenderScale = 1;

export const THREE_D_MODEL_VIEWER_RENDERER_KEY = "website-hero-3d-model-viewer";
const THREE_D_MODEL_VIEWER_Z_INDEX = 11;
const THREE_D_MODEL_VIEWER_WIDTH = 900;
const THREE_D_MODEL_VIEWER_HEIGHT = 650;

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
    "background:transparent",
    "display:block",
    "position:relative",
    "overflow:visible",
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
  modelViewer.setAttribute("camera-orbit", "0deg 65deg 128%");
  // Euler angles roll(z) pitch(x) yaw(y): roll tilts the visual spin axis.
  modelViewer.setAttribute("orientation", "12deg 0deg 0deg");
  modelViewer.setAttribute("shadow-intensity", "1");
  modelViewer.setAttribute("exposure", "1");
  modelViewer.style.cssText = [
    "display:block",
    // Oversize the render surface so the model can visually spill past the object bounds.
    "position:absolute",
    "left:-60%",
    "top:-60%",
    "width:220%",
    "height:220%",
    "pointer-events:none",
    "transform:none",
  ].join(";");

  root.appendChild(modelViewer);

  // Suppress the default loading progress bar (dark edge at the top).
  const emptyProgressBar = document.createElement("div");
  emptyProgressBar.setAttribute("slot", "progress-bar");
  modelViewer.appendChild(emptyProgressBar);

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
      object.isRotatable = true;
      object.zIndex = THREE_D_MODEL_VIEWER_Z_INDEX;

      const previousWidget = mountedWidgets.get(object.id);
      if (previousWidget) {
        previousWidget.destroy();
        previousWidget.root.remove();
        mountedWidgets.delete(object.id);
      }

      const mountedWidget = mountThreeDModelViewerWidget(normalizeThreeDModelViewerState(data));
      container.innerHTML = "";
      container.style.overflow = "visible";
      container.appendChild(mountedWidget.root);
      requestAnimationFrame(() => {
        const objectElement = container.closest<HTMLElement>(".object");
        if (objectElement) {
          objectElement.style.zIndex = `${THREE_D_MODEL_VIEWER_Z_INDEX}`;
          objectElement.style.overflow = "visible";
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

  customElement.isRotatable = true;
  customElement.isResizable = true;
  customElement.zIndex = THREE_D_MODEL_VIEWER_Z_INDEX;

  return customElement;
}
