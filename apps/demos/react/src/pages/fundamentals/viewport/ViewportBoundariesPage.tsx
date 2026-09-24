import { useRef } from "react";
import { KritzelEditor, type HTMLKritzelEditorElement } from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { buttonStyle, editorStyle, hostStyle, seedEditor, toolbarStyle } from "../../shared/demo-shared";

const themes = [reactThemeLight, reactThemeDark];
const panStep = 100;

export function ViewportBoundariesPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);

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

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        <button style={buttonStyle()} onClick={() => void panBy(0, -panStep)}>Pan Up</button>
        <button style={buttonStyle()} onClick={() => void panBy(0, panStep)}>Pan Down</button>
        <button style={buttonStyle()} onClick={() => void panBy(-panStep, 0)}>Pan Left</button>
        <button style={buttonStyle()} onClick={() => void panBy(panStep, 0)}>Pan Right</button>
      </div>
      <KritzelEditor
        ref={editorRef}
        editorId="viewport-boundaries"
        theme="light"
        themes={themes}
        syncConfig={undefined}
        loginConfig={undefined}
        viewportBoundaryLeft={-500}
        viewportBoundaryRight={500}
        viewportBoundaryTop={-400}
        viewportBoundaryBottom={400}
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