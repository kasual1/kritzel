import { CSSProperties, useCallback, useRef } from "react";
import { KritzelEditor } from "kritzel-react";
import { seedEditor } from "../concepts/shared/concept-shared";

const hostStyle: CSSProperties = {
  display: "block",
  height: "100%",
};

export function WebsiteHeroPage() {
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
        editorId="website-hero"
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        onIsReady={onReady}
      />
    </div>
  );
}