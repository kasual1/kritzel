import { useRef } from "react";
import { KritzelEditor, HTMLKritzelEditorElement } from "kritzel-react";
import { reactThemeLight } from "../../../const/react-theme-light";
import { editorStyle, hostStyle, seedEditor } from "../shared/concept-shared";

export function ComponentsEditorPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);

  return (
    <div style={hostStyle}>
      <KritzelEditor
        ref={editorRef}
        editorId="components-editor"
        isPanningEnabled={false}
        isZoomingEnabled={false}
        theme="light"
        themes={[reactThemeLight]}
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
