import { useRef } from "react";
import { KritzelEditor, HTMLKritzelEditorElement } from "kritzel-react";
import { reactThemeLight } from "../../../const/react-theme-light";
import { editorStyle, hostStyle, seedEditor } from "../shared/concept-shared";

export function ComponentsEditorUiPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);

  return (
    <div style={hostStyle}>
      <KritzelEditor
        ref={editorRef}
        editorId="components-editor-ui"
        theme="light"
        themes={[reactThemeLight]}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isWorkspaceManagerVisible={false}
        isMoreMenuVisible={false}
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
