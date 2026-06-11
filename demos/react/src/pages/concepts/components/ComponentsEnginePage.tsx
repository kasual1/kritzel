import { useRef } from "react";
import {
  KritzelBrushTool,
  KritzelEngine,
  KritzelEraserTool,
  KritzelSelectionTool,
} from "kritzel-react";
import { buttonStyle, hostStyle, toolbarStyle } from "../shared/concept-shared";
import { createSeedObjects } from "../../basic-usage/seed-objects";

export function ComponentsEnginePage() {
  const engineRef = useRef<HTMLKritzelEngineElement | null>(null);

  async function withEngine(action: (engine: HTMLKritzelEngineElement) => Promise<void>) {
    if (engineRef.current) {
      await action(engineRef.current);
    }
  }

  async function onReady() {
    const engine = engineRef.current;
    if (!engine) {
      return;
    }

    await engine.registerTool("brush", KritzelBrushTool);
    await engine.registerTool("eraser", KritzelEraserTool);
    await engine.registerTool("select", KritzelSelectionTool);

    for (const obj of createSeedObjects()) {
      await engine.addObject(obj);
    }

    await engine.changeActiveToolByName("brush");
  }

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        <button style={buttonStyle(false)} onClick={() => void withEngine((engine) => engine.changeActiveToolByName("brush"))}>Brush</button>
        <button style={buttonStyle(false)} onClick={() => void withEngine((engine) => engine.changeActiveToolByName("eraser"))}>Eraser</button>
        <button style={buttonStyle(false)} onClick={() => void withEngine((engine) => engine.changeActiveToolByName("select"))}>Select</button>
        <button style={buttonStyle(false)} onClick={() => void withEngine((engine) => engine.undo())}>Undo</button>
        <button style={buttonStyle(false)} onClick={() => void withEngine((engine) => engine.redo())}>Redo</button>
      </div>
      <KritzelEngine
        ref={engineRef}
        editorId="components-engine"
        wheelEnabled={false}
        onIsEngineReady={() => {
          void onReady();
        }}
        style={{ flex: 1, minHeight: 0, display: "block" }}
      />
    </div>
  );
}
