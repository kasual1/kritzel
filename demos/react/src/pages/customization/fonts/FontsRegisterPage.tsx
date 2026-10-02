import { useRef } from "react";
import { KritzelEditor, KritzelText, KritzelWorkspace, type HTMLKritzelEditorElement, type KritzelFontMap, type KritzelTheme } from "@kritzel/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";
import { editorStyle, hostStyle } from "../../shared/demo-shared";
import { Toolbar } from "../../../components/Toolbar";

const fonts: KritzelFontMap = {
  pacifico: { family: "Pacifico", label: "Pacifico Cursive", cssFontFamily: "'Pacifico', cursive", source: "https://fonts.googleapis.com/css2?family=Pacifico&display=swap" },
};

const themes: KritzelTheme[] = [{ ...reactThemeLight, name: "custom", global: { ...reactThemeLight.global, fontFamily: "Pacifico" } }];

const workspaces = [
  new KritzelWorkspace({
    id: "fonts-register",
    name: "Custom Fonts",
    objects: [
      new KritzelText({
        text: "Handwritten Pacifico Font",
        translateX: -180,
        translateY: -50,
        fontSize: 24,
        fontFamily: "Pacifico",
        fontColor: { light: "#0959a4", dark: "#2f8be0" },
      }),
    ],
  }),
];

export function FontsRegisterPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);

  async function addPacificoText() {
    const editor = editorRef.current;
    if (!editor) return;
    const viewport = await editor.getViewport();
    const visibleWidth = viewport.width / viewport.scale;
    const visibleHeight = viewport.height / viewport.scale;
    const visibleLeft = -viewport.translateX / viewport.scale;
    const visibleTop = -viewport.translateY / viewport.scale;
    await editor.addObject(new KritzelText({
      text: "Handwritten Pacifico Font",
      translateX: visibleLeft + visibleWidth * (0.2 + Math.random() * 0.6),
      translateY: visibleTop + visibleHeight * (0.2 + Math.random() * 0.6),
      fontSize: 24,
      fontFamily: "Pacifico",
      fontColor: { light: "#0959a4", dark: "#2f8be0" },
    }));
  }

  return (
    <div style={hostStyle}>
      <Toolbar><button onClick={() => void addPacificoText()}>Add Pacifico Text</button></Toolbar>
      <KritzelEditor ref={editorRef} editorId="fonts-register" customFonts={fonts} workspaces={workspaces} theme="custom" themes={themes} isPanningEnabled={false} isZoomingEnabled={false} isMoreMenuVisible style={editorStyle} />
    </div>
  );
}
