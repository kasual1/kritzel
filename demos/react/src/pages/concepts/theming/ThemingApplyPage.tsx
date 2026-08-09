import { useRef, useState } from "react";
import {
  KritzelEditor,
  HTMLKritzelEditorElement,
} from "kritzel-react";
import { reactThemeLight } from "../../../const/react-theme-light";
import { reactThemeDark } from "../../../const/react-theme-dark";
import {
  buttonStyle,
  editorStyle,
  hostStyle,
  seedEditor,
  toolbarStyle,
} from "../shared/concept-shared";

export function ThemingApplyPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [activeName, setActiveName] = useState("light");

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        <button style={buttonStyle(activeName === "light")} onClick={() => setActiveName("light")}>Light</button>
        <button style={buttonStyle(activeName === "dark")} onClick={() => setActiveName("dark")}>Dark</button>
      </div>
      <KritzelEditor
        ref={editorRef}
        editorId="theming-apply"
        theme={activeName}
        themes={[reactThemeLight, reactThemeDark]}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={true}
        isWorkspaceManagerVisible={true}
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
