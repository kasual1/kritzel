import { useEffect, useMemo, useRef } from "react";
import { KritzelDynamicObjectRendererRegistry, KritzelEditor, KritzelWorkspace } from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { createHtmlCalculator, createHtmlCalculatorObject, HTML_CALCULATOR_RENDERER_KEY, normalizeCalculatorState, type HtmlCalculatorInstance } from "./html-calculator";

export function DynamicObjectsHtmlPage() {
  const mountedCalculators = useRef(new Map<string, HtmlCalculatorInstance>());
  const workspaces = useMemo(() => [new KritzelWorkspace({ objects: [createHtmlCalculatorObject()] })], []);

  useEffect(() => {
    const calculators = mountedCalculators.current;
    const destroy = (objectId: string, container: HTMLElement | null) => {
      calculators.get(objectId)?.destroy();
      calculators.delete(objectId);
      if (container) container.innerHTML = "";
    };
    KritzelDynamicObjectRendererRegistry.register(HTML_CALCULATOR_RENDERER_KEY, {
      onMount: ({ object, container, data }) => {
        if (!container) return;
        destroy(object.id, container);
        const instance = createHtmlCalculator(normalizeCalculatorState(data));
        calculators.set(object.id, instance);
        container.style.overflow = "visible";
        container.appendChild(instance.element);
      },
      onSerialize: ({ object, data }) => calculators.get(object.id)?.getState() ?? normalizeCalculatorState(data),
      onUnmount: ({ object, container, data }) => {
        const state = calculators.get(object.id)?.getState() ?? normalizeCalculatorState(data);
        destroy(object.id, container);
        return state;
      },
    });
    return () => {
      calculators.forEach((instance) => instance.destroy());
      calculators.clear();
      KritzelDynamicObjectRendererRegistry.unregister(HTML_CALCULATOR_RENDERER_KEY);
    };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <KritzelEditor
        editorId="dynamic-objects-html"
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
