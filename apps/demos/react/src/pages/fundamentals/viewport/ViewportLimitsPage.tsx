import { useRef } from "react";
import { KritzelEditor, type HTMLKritzelEditorElement } from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { buttonStyle, editorStyle, hostStyle, seedEditor, toolbarStyle } from "../../shared/demo-shared";

const themes = [reactThemeLight, reactThemeDark];
const zoomFactor = 1.1;

export function ViewportLimitsPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        <button style={buttonStyle()} onClick={() => void editorRef.current?.zoomIn(zoomFactor, 200)}>Zoom In</button>
        <button style={buttonStyle()} onClick={() => void editorRef.current?.zoomOut(zoomFactor, 200)}>Zoom Out</button>
      </div>
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