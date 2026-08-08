import { CSSProperties, useCallback, useRef } from "react";
import { KritzelEditor } from "kritzel-react";
import { reactThemeLight } from "../../const/react-theme-light";
import { seedEditor } from "../concepts/shared/concept-shared";

const hostStyle: CSSProperties = {
  display: "block",
  height: "100%",
};

export function QuickstartPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);

  const onReady = useCallback(async () => {
    if (editorRef.current) {
      await seedEditor(editorRef.current);
    }
  }, []);

  return (
    <div style={hostStyle}>
      <KritzelEditor
        ref={editorRef}
        editorId="quickstart"
        theme="light"
        themes={[reactThemeLight]}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        onIsReady={onReady}
      />
    </div>
  );
}
