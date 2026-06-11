import { useRef } from "react";
import { KritzelEditor, HTMLKritzelEditorElement } from "kritzel-react";
import { customReactTheme } from "../../../const/custom-react-theme";
import { editorStyle, hostStyle, seedEditor } from "../shared/concept-shared";

export function ComponentsEditorPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);

  return (
    <div style={hostStyle}>
      <KritzelEditor
        ref={editorRef}
        editorId="components-editor"
        wheelEnabled={false}
        theme="react-theme"
        themes={[customReactTheme]}
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
