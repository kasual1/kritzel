import { KritzelEditor } from "kritzel-react";
import { reactThemeLight } from "../../const/react-theme-light";
import { useSearchParams } from "react-router-dom";

export function WrappedEditorPage() {
  const [searchParams] = useSearchParams();
  const width = parseInt(searchParams.get("width") || "320", 10);
  const height = parseInt(searchParams.get("height") || "600", 10);

  return (
    <div
      id="e2e-editor-wrapper"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        boxSizing: "border-box",
        border: "4px solid #ff0080",
        background: "#fafafa",
        position: "relative",
        overflow: "hidden",
        margin: "24px",
      }}
    >
      <KritzelEditor
        style={{ width: "100%", height: "100%" }}
        theme="react-theme"
        themes={[reactThemeLight]}
      />
    </div>
  );
}
