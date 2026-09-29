import { useRef } from "react";
import { KritzelEditor, type HTMLKritzelEditorElement } from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { editorStyle, hostStyle, seedEditor } from "../../shared/demo-shared";
import { Toolbar } from "../../../components/Toolbar";

const themes = [reactThemeLight, reactThemeDark];
const zoomFactor = 1.1;

export function ViewportLimitsPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);

  return (
    <div style={hostStyle}>
      <Toolbar>
        <button onClick={() => void editorRef.current?.zoomIn(zoomFactor, 200)}>Zoom In</button>
        <button onClick={() => void editorRef.current?.zoomOut(zoomFactor, 200)}>Zoom Out</button>
      </Toolbar>
      <KritzelEditor
        ref={editorRef}
        editorId="viewport-limits"
        theme="light"
        themes={themes}
        syncConfig={undefined}
        loginConfig={undefined}
        scaleMin={0.5}
        scaleMax={2}
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