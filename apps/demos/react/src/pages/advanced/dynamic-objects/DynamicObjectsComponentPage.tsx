import { useEffect, useMemo, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  KritzelDynamicObject,
  KritzelEditor,
  KritzelWorkspace,
} from "@kritzel/react-editor";
import { KritzelDynamicObjectRendererRegistry } from "@kritzel/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { CalculatorWidget } from "./CalculatorWidget";
import { createCalculatorInitialState, normalizeCalculatorState, type CalculatorState } from "./html-calculator";

const CALCULATOR_RENDERER_KEY = "react-dynamic-object-calculator";

type MountedCalculatorRenderer = {
  root: Root;
  latestState: CalculatorState;
};

function createCalculatorObject(): KritzelDynamicObject {
  const placeholder = document.createElement("div");
  placeholder.textContent = "Loading Calculator...";
  const object = new KritzelDynamicObject({ element: placeholder, rendererKey: CALCULATOR_RENDERER_KEY, rendererData: createCalculatorInitialState(), translateX: -130, translateY: -190, width: 260, height: 320 });
  object.isRotatable = false;
  return object;
}

export function DynamicObjectsComponentPage() {
  const mountedRenderers = useRef<Map<string, MountedCalculatorRenderer>>(new Map());
  const workspaces = useMemo(() => [new KritzelWorkspace({ objects: [createCalculatorObject()] })], []);

  useEffect(() => {
    const renderers = mountedRenderers.current;
    KritzelDynamicObjectRendererRegistry.register(CALCULATOR_RENDERER_KEY, {
      onMount: ({ object, container, data }) => {
        if (!container) {
          return;
        }

        renderers.get(object.id)?.root.unmount();
        container.innerHTML = "";
        container.style.overflow = "visible";
        const initialState = normalizeCalculatorState(data);

        const root = createRoot(container);
        const renderer: MountedCalculatorRenderer = { root, latestState: initialState };
        renderers.set(object.id, renderer);

        root.render(
          <CalculatorWidget
            initialState={initialState}
            onStateChange={(nextState) => {
              const current = renderers.get(object.id);
              if (current) {
                current.latestState = nextState;
              }
            }}
          />,
        );
      },
      onSerialize: ({ object, data }) => ({ ...(renderers.get(object.id)?.latestState ?? normalizeCalculatorState(data)) }),
      onUnmount: ({ object, container }) => {
        const renderer = renderers.get(object.id);
        if (!renderer) {
          return undefined;
        }

        const snapshot = renderer.latestState;
        renderer.root.unmount();
        renderers.delete(object.id);

        if (container) {
          container.innerHTML = "";
        }

        return snapshot;
      },
    });

    return () => {
      renderers.forEach((renderer) => {
        renderer.root.unmount();
      });
      renderers.clear();
      KritzelDynamicObjectRendererRegistry.unregister(CALCULATOR_RENDERER_KEY);
    };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <KritzelEditor
        editorId="dynamic-objects-component"
        theme="light"
        themes={[reactThemeLight, reactThemeDark]}
        workspaces={workspaces}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        style={{ flex: 1, minHeight: 0 }}
      />
    </div>
  );
}
