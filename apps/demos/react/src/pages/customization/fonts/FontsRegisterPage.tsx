import { useRef } from "react";
import { KritzelEditor, KritzelText, type HTMLKritzelEditorElement, type KritzelFontMap, type KritzelTheme } from "@kritzel/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";
import { buttonStyle, editorStyle, hostStyle, toolbarStyle } from "../../shared/demo-shared";

const fonts: KritzelFontMap = {
  pacifico: { family: "Pacifico", label: "Pacifico Cursive", cssFontFamily: "'Pacifico', cursive", source: "https://fonts.googleapis.com/css2?family=Pacifico&display=swap" },
};

const themes: KritzelTheme[] = [{ ...reactThemeLight, name: "custom", global: { ...reactThemeLight.global, fontFamily: "Pacifico" } }];

export function FontsRegisterPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);

  async function addPacificoText() {
    const editor = editorRef.current;
    if (!editor) return;
    const viewport = await editor.getViewport();
    const visibleWidth = viewport.width / viewport.scale;
    const visibleHeight = viewport.height / viewport.scale;
    await editor.addObject(new KritzelText({
      text: "Handwritten Pacifico Font",
      translateX: -viewport.translateX / viewport.scale + visibleWidth * (0.2 + Math.random() * 0.6),
      translateY: -viewport.translateY / viewport.scale + visibleHeight * (0.2 + Math.random() * 0.6),
      fontSize: 24,
      fontFamily: "Pacifico",
      fontColor: { light: "#087ea4", dark: "#61dafb" },
    }));
  }

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}><button style={buttonStyle()} onClick={() => void addPacificoText()}>Add Pacifico Text</button></div>
      <KritzelEditor ref={editorRef} editorId="fonts-register" customFonts={fonts} theme="custom" themes={themes} isPanningEnabled={false} isZoomingEnabled={false} isMoreMenuVisible onIsReady={() => void addPacificoText()} style={editorStyle} />
    </div>
  );
}
