import { useRef } from "react";
import { KritzelEditor, type HTMLKritzelEditorElement, type KritzelFontMap } from "@kritzel/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";

const fonts: KritzelFontMap = {
  pacifico: { family: "Pacifico", label: "Pacifico Cursive", cssFontFamily: "'Pacifico', cursive", source: "https://fonts.googleapis.com/css2?family=Pacifico&display=swap" },
  "fira-code": { family: "Fira Code", label: "Fira Code Monospace", cssFontFamily: "'Fira Code', monospace", source: "https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;700&display=swap" },
  "space-grotesk": { family: "Space Grotesk", label: "Space Grotesk Sans", cssFontFamily: "'Space Grotesk', sans-serif", source: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&display=swap" },
};

export function FontsRegisterPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "sans-serif" }}>
      <div style={{ padding: 8, background: "#f5f5f5", borderBottom: "1px solid #ddd" }}>Custom Fonts: Pacifico, Fira Code, Space Grotesk</div>
      <KritzelEditor ref={editorRef} editorId="fonts-register" customFonts={fonts} theme="light" themes={[reactThemeLight]} isPanningEnabled={false} isZoomingEnabled={false} isMoreMenuVisible style={{ flex: 1, minHeight: 0 }} />
    </div>
  );
}
