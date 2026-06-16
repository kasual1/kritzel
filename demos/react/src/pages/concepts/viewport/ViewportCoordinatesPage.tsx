import { useRef, useState } from "react";
import {
  KritzelEditor,
  HTMLKritzelEditorElement,
} from "kritzel-react";
import { customReactTheme } from "../../../const/custom-react-theme";
import {
  buttonStyle,
  editorStyle,
  hostStyle,
  seedEditor,
  toolbarStyle,
} from "../shared/concept-shared";

export function ViewportCoordinatesPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [worldCoords, setWorldCoords] = useState<{ x: number; y: number } | null>(null);
  const [screenCoords, setScreenCoords] = useState<{ x: number; y: number } | null>(null);
  const [screenX, setScreenX] = useState(200);
  const [screenY, setScreenY] = useState(150);
  const [worldX, setWorldX] = useState(0);
  const [worldY, setWorldY] = useState(0);

  async function convertScreenToWorld() {
    setWorldCoords((await editorRef.current?.screenToWorld(screenX, screenY)) ?? null);
  }

  async function convertWorldToScreen() {
    setScreenCoords((await editorRef.current?.worldToScreen(worldX, worldY)) ?? null);
  }

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        <span style={{ fontSize: "13px", fontWeight: 500 }}>Screen -&gt; World</span>
        <input value={screenX} onChange={(event) => setScreenX(Number(event.target.value))} type="number" style={{ width: "80px" }} />
        <input value={screenY} onChange={(event) => setScreenY(Number(event.target.value))} type="number" style={{ width: "80px" }} />
        <button style={buttonStyle(false)} onClick={() => void convertScreenToWorld()}>Convert</button>
        <span style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: "13px" }}>
          {worldCoords ? `World: (${worldCoords.x.toFixed(1)}, ${worldCoords.y.toFixed(1)})` : ""}
        </span>
      </div>
      <div style={toolbarStyle}>
        <span style={{ fontSize: "13px", fontWeight: 500 }}>World -&gt; Screen</span>
        <input value={worldX} onChange={(event) => setWorldX(Number(event.target.value))} type="number" style={{ width: "80px" }} />
        <input value={worldY} onChange={(event) => setWorldY(Number(event.target.value))} type="number" style={{ width: "80px" }} />
        <button style={buttonStyle(false)} onClick={() => void convertWorldToScreen()}>Convert</button>
        <span style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: "13px" }}>
          {screenCoords ? `Screen: (${screenCoords.x.toFixed(1)}, ${screenCoords.y.toFixed(1)})` : ""}
        </span>
      </div>
      <KritzelEditor
        ref={editorRef}
        editorId="viewport-coordinates"
        theme="react-theme"
        themes={[customReactTheme]}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        onIsReady={() => {
          if (editorRef.current) {
            void seedEditor(editorRef.current);
          }
        }}
        style={editorStyle}
      />
    </div>
  );
}
