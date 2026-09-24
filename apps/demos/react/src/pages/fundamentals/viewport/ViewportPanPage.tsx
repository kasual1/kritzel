import { useRef } from "react";
import { KritzelEditor, type HTMLKritzelEditorElement } from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { buttonStyle, editorStyle, hostStyle, seedEditor, toolbarStyle } from "../../shared/demo-shared";

const themes = [reactThemeLight, reactThemeDark];

export function ViewportPanPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);

  async function setViewportCenter() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const currentViewport = await editor.getViewport();
    await editor.setViewport(100, 100, currentViewport.scale);
  }

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        <button style={buttonStyle()} onClick={() => void editorRef.current?.panTo(0, 0)}>Pan to Origin</button>
        <button style={buttonStyle()} onClick={() => void editorRef.current?.panTo(200, 150)}>Pan to (200, 150)</button>
        <button style={buttonStyle()} onClick={() => void setViewportCenter()}>Center on (100, 100)</button>
      </div>
      <KritzelEditor
        ref={editorRef}
        editorId="viewport-pan"
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