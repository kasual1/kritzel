import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  KritzelDynamicObject,
  KritzelEditor,
  type HTMLKritzelEditorElement,
} from "@kritzel/react-editor";
import { KritzelDynamicObjectRendererRegistry } from "@kritzel/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";
import { CounterWidget, createCounterWidgetInitialState, type CounterWidgetState } from "./CounterWidget";

const COUNTER_RENDERER_KEY = "react-dynamic-object-counter";

type MountedCounterRenderer = {
  root: Root;
  latestState: CounterWidgetState;
};

export function DynamicObjectsComponentPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const hasAddedInitialDynamicObject = useRef(false);
  const mountedRenderers = useRef<Map<string, MountedCounterRenderer>>(new Map());

  useEffect(() => {
    KritzelDynamicObjectRendererRegistry.register(COUNTER_RENDERER_KEY, {
      onMount: ({ object, container, data }) => {
        if (!container) {
          return;
        }

        const initialState = (data as CounterWidgetState | undefined) ?? createCounterWidgetInitialState();

        const root = createRoot(container);
        const renderer: MountedCounterRenderer = { root, latestState: initialState };
        mountedRenderers.current.set(object.id, renderer);

        root.render(
          <CounterWidget
            initialState={initialState}
            onStateChange={(nextState) => {
              const current = mountedRenderers.current.get(object.id);
              if (current) {
                current.latestState = nextState;
              }
            }}
          />,
        );
      },
      onUnmount: ({ object, container }) => {
        const renderer = mountedRenderers.current.get(object.id);
        if (!renderer) {
          return undefined;
        }

        const snapshot = renderer.latestState;
        renderer.root.unmount();
        mountedRenderers.current.delete(object.id);

        if (container) {
          container.innerHTML = "";
        }

        return snapshot;
      },
    });

    return () => {
      mountedRenderers.current.forEach((renderer) => {
        renderer.root.unmount();
      });
      mountedRenderers.current.clear();
      KritzelDynamicObjectRendererRegistry.unregister(COUNTER_RENDERER_KEY);
    };
  }, []);

  async function onReady() {
    if (hasAddedInitialDynamicObject.current) {
      return;
    }

    const objectCount = await editorRef.current?.getObjectsTotalCount();
    if ((objectCount ?? 0) > 0) {
      return;
    }

    hasAddedInitialDynamicObject.current = true;

    const placeholder = document.createElement("div");
    placeholder.textContent = "Loading Counter...";

    const dynamicObject = new KritzelDynamicObject({
      element: placeholder,
      rendererKey: COUNTER_RENDERER_KEY,
      rendererData: createCounterWidgetInitialState(),
      translateX: -150,
      translateY: -90,
      width: 260,
      height: 160,
    });

    dynamicObject.isRotatable = false;

    await editorRef.current?.addObject(dynamicObject);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 8, background: "#f5f5f5", borderBottom: "1px solid #ddd" }}>
        <strong>Registered Component:</strong>
        <span>The object mounts a real React component via the renderer registry.</span>
      </div>
      <KritzelEditor
        ref={editorRef}
        editorId="dynamic-objects-component"
        theme="light"
        themes={[reactThemeLight]}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        onIsReady={() => {
          void onReady();
        }}
        style={{ flex: 1, minHeight: 0 }}
      />
    </div>
  );
}
