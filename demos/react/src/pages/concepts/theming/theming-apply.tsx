import { useRef, useState } from "react";
import {
  KritzelEditor,
  darkTheme,
  type HTMLKritzelEditorElement,
  type KritzelTheme,
} from "kritzel-react";
import { customReactTheme } from "../../../const/custom-react-theme";
import {
  buttonStyle,
  editorStyle,
  hostStyle,
  seedEditor,
  toolbarStyle,
} from "../shared/concept-shared";

const themedDark: KritzelTheme = {
  ...darkTheme,
  name: "react-theme-dark",
};

export function ThemingApplyPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [activeName, setActiveName] = useState("react-theme");

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        <button style={buttonStyle(activeName === "react-theme")} onClick={() => setActiveName("react-theme")}>Light</button>
        <button style={buttonStyle(activeName === "react-theme-dark")} onClick={() => setActiveName("react-theme-dark")}>Dark</button>
      </div>
      <KritzelEditor
        ref={editorRef}
        editorId="theming-apply"
        theme={activeName}
        themes={[customReactTheme, themedDark]}
        wheelEnabled={false}
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
