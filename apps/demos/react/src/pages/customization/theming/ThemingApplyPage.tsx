import { useRef, useState } from "react";
import {
  KritzelEditor,
  HTMLKritzelEditorElement,
} from "@kritzel/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";
import { reactThemeDark } from "../../../const/react-theme-dark";
import {
  editorStyle,
  hostStyle,
  seedEditor,
} from "../../shared/demo-shared";
import { Toolbar } from "../../../components/Toolbar";

const themes = [reactThemeLight, reactThemeDark];

export function ThemingApplyPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [activeName, setActiveName] = useState("light");

  return (
    <div style={hostStyle}>
      <Toolbar>
        <button className={activeName === "light" ? "active" : undefined} onClick={() => setActiveName("light")}>Light</button>
        <button className={activeName === "dark" ? "active" : undefined} onClick={() => setActiveName("dark")}>Dark</button>
      </Toolbar>
      <KritzelEditor
        ref={editorRef}
        editorId="theming-apply"
        theme={activeName}
        themes={themes}
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
