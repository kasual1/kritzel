import { useRef } from "react";
import { KritzelEditor, type HTMLKritzelEditorElement, type KritzelFontMap, type KritzelTheme } from "@kritzel/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";

const fonts: KritzelFontMap = {
  pacifico: {
    family: "Pacifico",
    label: "Pacifico Cursive",
    cssFontFamily: "'Pacifico', cursive",
    source: "https://fonts.googleapis.com/css2?family=Pacifico&display=swap",
  },
};

const themes: KritzelTheme[] = [{
  ...reactThemeLight,
  global: { ...reactThemeLight.global, fontFamily: "'Pacifico', cursive" },
}];

export function FontsUiFontFamilyPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);

  return (
    <KritzelEditor
      ref={editorRef}
      editorId="fonts-ui-font-family"
      customFonts={fonts}
      theme="light"
      themes={themes}
      isPanningEnabled={false}
      isZoomingEnabled={false}
      isMoreMenuVisible
      onIsReady={() => void editorRef.current?.openSettingsDialog()}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}