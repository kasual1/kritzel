import { useRef } from "react";
import { UpmadeEditor, type HTMLUpmadeEditorElement, type UpmadeFontMap, type UpmadeTheme } from "@upmade/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";

const fonts: UpmadeFontMap = {
  pacifico: {
    family: "Pacifico",
    label: "Pacifico Cursive",
    cssFontFamily: "'Pacifico', cursive",
    source: "https://fonts.googleapis.com/css2?family=Pacifico&display=swap",
  },
};

const themes: UpmadeTheme[] = [{
  ...reactThemeLight,
  global: { ...reactThemeLight.global, fontFamily: "'Pacifico', cursive" },
}];

export function FontsUiFontFamilyPage() {
  const editorRef = useRef<HTMLUpmadeEditorElement | null>(null);

  return (
    <UpmadeEditor
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