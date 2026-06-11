import { useRef } from "react";
import { KritzelEditor, HTMLKritzelEditorElement } from "kritzel-react";
import { customReactTheme } from "../../../const/custom-react-theme";
import { editorStyle, hostStyle, seedEditor } from "../shared/concept-shared";

export function ComponentsEditorUiPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);

  return (
    <div style={hostStyle}>
      <KritzelEditor
        ref={editorRef}
        editorId="components-editor-ui"
        wheelEnabled={false}
        theme="react-theme"
        themes={[customReactTheme]}
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
