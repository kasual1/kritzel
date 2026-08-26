import { KritzelEditor } from "kritzel-react";
import { reactThemeLight } from "../../const/react-theme-light";

const styles = {
  multiEditorHost: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    padding: "24px",
    boxSizing: "border-box" as const,
    height: "100%",
    width: "100%",
    background: "linear-gradient(135deg, #f7f8fb, #fef6f7)",
  },
  editorContainer: {
    position: "relative" as const,
    overflow: "hidden",
    borderRadius: "12px",
    background: "#ffffff",
  },
  editorContainerFirst: {
    border: "2px solid #3f7ac8",
  },
  editorContainerSecond: {
    border: "2px solid #d65067",
  },
} as const;

export function MultiEditorPage() {
  return (
    <div style={styles.multiEditorHost}>
      <div style={{ ...styles.editorContainer, ...styles.editorContainerFirst }}>
        <KritzelEditor id="editor-1" editorId="e2e-editor-1" theme="light" themes={[reactThemeLight]} />
      </div>
      <div style={{ ...styles.editorContainer, ...styles.editorContainerSecond }}>
        <KritzelEditor id="editor-2" editorId="e2e-editor-2" theme="light" themes={[reactThemeLight]} />
      </div>
    </div>
  );
}
