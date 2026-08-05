import { useRef, useState } from "react";
import {
  KritzelEditor,
  HTMLKritzelEditorElement,
  type KritzelViewportState,
} from "kritzel-react";
import { reactThemeLight } from "../../../const/react-theme-light";
import {
  buttonStyle,
  editorStyle,
  hostStyle,
  seedEditor,
  statusBarStyle,
  toolbarStyle,
} from "../shared/concept-shared";

export function ViewportChangePage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [viewport, setViewport] = useState<KritzelViewportState | null>(null);

  async function zoomIn() {
    const current = viewport?.scale ?? 1;
    await editorRef.current?.zoomTo(Math.min(current * 1.5, 5));
  }

  async function zoomOut() {
    const current = viewport?.scale ?? 1;
    await editorRef.current?.zoomTo(Math.max(current / 1.5, 0.1));
  }

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        <button style={buttonStyle(false)} onClick={() => void editorRef.current?.panTo(0, 0)}>Pan to Origin</button>
        <button style={buttonStyle(false)} onClick={() => void editorRef.current?.panTo(200, 150)}>Pan to (200, 150)</button>
        <button style={buttonStyle(false)} onClick={() => void zoomIn()}>Zoom In</button>
        <button style={buttonStyle(false)} onClick={() => void zoomOut()}>Zoom Out</button>
        <button style={buttonStyle(false)} onClick={() => void editorRef.current?.setViewport(100, 100, 0.5)}>Set (100, 100, 0.5)</button>
      </div>
      <KritzelEditor
        ref={editorRef}
        editorId="viewport-change"
        theme="react-theme"
        themes={[reactThemeLight]}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        onIsReady={() => {
          if (editorRef.current) {
            void seedEditor(editorRef.current);
          }
        }}
        onViewportChange={(event) => {
          setViewport((event as CustomEvent<KritzelViewportState>).detail);
        }}
        style={editorStyle}
      />
      <div style={{ ...statusBarStyle, fontFamily: "monospace" }}>
        <span>Zoom: {Math.round((viewport?.scale ?? 1) * 100)}%</span>
        <span>X: {Math.round(viewport?.translateX ?? 0)}</span>
        <span>Y: {Math.round(viewport?.translateY ?? 0)}</span>
      </div>
    </div>
  );
}
