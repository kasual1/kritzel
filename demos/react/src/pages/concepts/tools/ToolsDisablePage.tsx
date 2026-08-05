import { useRef, useState } from "react";
import {
  KritzelEditor,
  HTMLKritzelEditorElement,
} from "kritzel-react";
import { reactThemeLight } from "../../../const/react-theme-light";
import {
  buttonStyle,
  editorStyle,
  hostStyle,
  seedEditor,
  toolbarStyle,
} from "../shared/concept-shared";

export function ToolsDisablePage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [isDisabled, setIsDisabled] = useState(true);

  async function onReady() {
    if (!editorRef.current) {
      return;
    }

    await seedEditor(editorRef.current);
    await editorRef.current.disable();
  }

  async function toggle() {
    if (!editorRef.current) {
      return;
    }

    if (isDisabled) {
      await editorRef.current.enable();
      setIsDisabled(false);
      return;
    }

    await editorRef.current.disable();
    setIsDisabled(true);
  }

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        <button style={buttonStyle(false)} onClick={() => void toggle()}>
          {isDisabled ? "Enable" : "Disable"}
        </button>
        <span style={{ fontSize: "13px", color: isDisabled ? "#e53935" : "#333" }}>
          {isDisabled ? "Interactions disabled" : "Interactions enabled"}
        </span>
      </div>
      <KritzelEditor
        ref={editorRef}
        editorId="tools-disable"
        theme="react-theme"
        themes={[reactThemeLight]}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        onIsReady={() => {
          void onReady();
        }}
        style={editorStyle}
      />
    </div>
  );
}
