import { useRef, useState } from "react";
import {
  KritzelEditor,
  type HTMLKritzelEditorElement,
  type KritzelViewportState,
} from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { editorStyle, hostStyle, seedEditor } from "../../shared/demo-shared";
import { Toolbar } from "../../../components/Toolbar";

const themes = [reactThemeLight, reactThemeDark];
const panStep = 100;
const zoomFactor = 1.1;

export function ViewportEventsPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [viewport, setViewport] = useState<KritzelViewportState | null>(null);

  async function panBy(offsetX: number, offsetY: number) {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const currentViewport = await editor.getViewport();
    const centerWorldX = (currentViewport.width / 2 - currentViewport.translateX) / currentViewport.scale;
    const centerWorldY = (currentViewport.height / 2 - currentViewport.translateY) / currentViewport.scale;
    await editor.setViewport(
      centerWorldX + offsetX,
      centerWorldY + offsetY,
      currentViewport.scale,
    );
  }

  function onViewportChange(event: CustomEvent<KritzelViewportState>) {
    setViewport(event.detail);
  }

  return (
    <div style={hostStyle}>
      <Toolbar>
        <button onClick={() => void panBy(0, -panStep)}>Pan Up</button>
        <button onClick={() => void panBy(0, panStep)}>Pan Down</button>
        <button onClick={() => void panBy(-panStep, 0)}>Pan Left</button>
        <button onClick={() => void panBy(panStep, 0)}>Pan Right</button>
        <button onClick={() => void editorRef.current?.zoomIn(zoomFactor, 200)}>Zoom In</button>
        <button onClick={() => void editorRef.current?.zoomOut(zoomFactor, 200)}>Zoom Out</button>
        <span className="status">X: {Math.round(viewport?.translateX ?? 0)}</span>
        <span className="status">Y: {Math.round(viewport?.translateY ?? 0)}</span>
        <span className="status">Scale: {(viewport?.scale ?? 1).toFixed(2)}</span>
      </Toolbar>
      <KritzelEditor
        ref={editorRef}
        editorId="viewport-events"
        theme="light"
        themes={themes}
        syncConfig={undefined}
        loginConfig={undefined}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        onIsReady={() => {
          if (editorRef.current) {
            void seedEditor(editorRef.current);
          }
        }}
        onViewportChange={onViewportChange}
        style={editorStyle}
      />
    </div>
  );
}