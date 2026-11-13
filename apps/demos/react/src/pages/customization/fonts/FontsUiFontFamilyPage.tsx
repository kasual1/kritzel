import { useRef } from "react";
import { UpdrawEditor, type HTMLUpdrawEditorElement, type UpdrawFontMap, type UpdrawTheme } from "@updraw/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";

const fonts: UpdrawFontMap = {
  pacifico: {
    family: "Pacifico",
    label: "Pacifico Cursive",
    cssFontFamily: "'Pacifico', cursive",
    source: "https://fonts.googleapis.com/css2?family=Pacifico&display=swap",
  },
};

const themes: UpdrawTheme[] = [{
  ...reactThemeLight,
  global: { ...reactThemeLight.global, fontFamily: "'Pacifico', cursive" },
}];

export function FontsUiFontFamilyPage() {
  const editorRef = useRef<HTMLUpdrawEditorElement | null>(null);

  return (
    <UpdrawEditor
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