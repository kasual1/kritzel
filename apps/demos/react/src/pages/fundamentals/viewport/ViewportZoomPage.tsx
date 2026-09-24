import { useRef } from "react";
import { KritzelEditor, type HTMLKritzelEditorElement } from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { buttonStyle, editorStyle, hostStyle, seedEditor, toolbarStyle } from "../../shared/demo-shared";

const themes = [reactThemeLight, reactThemeDark];

export function ViewportZoomPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        <button style={buttonStyle()} onClick={() => void editorRef.current?.zoomIn()}>Zoom In</button>
        <button style={buttonStyle()} onClick={() => void editorRef.current?.zoomOut()}>Zoom Out</button>
        <button style={buttonStyle()} onClick={() => void editorRef.current?.zoomTo(1.5)}>Zoom to 150%</button>
        <button style={buttonStyle()} onClick={() => void editorRef.current?.zoomTo(2, 200, 150)}>Zoom at (200, 150)</button>
      </div>
      <KritzelEditor
        ref={editorRef}
        editorId="viewport-zoom"
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
        style={editorStyle}
      />
    </div>
  );
}