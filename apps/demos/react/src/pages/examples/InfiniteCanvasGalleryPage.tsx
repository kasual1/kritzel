import { useRef, type CSSProperties } from "react";
import { KritzelEditor, KritzelImage, type HTMLKritzelEditorElement } from "@kritzel/react-editor";
import { reactThemeDark } from "../../const/react-theme-dark";
import { reactThemeLight } from "../../const/react-theme-light";

type Artwork = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
};

const artworks: Artwork[] = [
  { id: 1, x: -1700, y: -1050, width: 420, height: 300, color: "0f766e" },
  { id: 2, x: -1120, y: -1180, width: 300, height: 420, color: "be123c" },
  { id: 3, x: -580, y: -980, width: 460, height: 280, color: "1d4ed8" },
  { id: 4, x: 80, y: -1120, width: 340, height: 430, color: "a16207" },
  { id: 5, x: 720, y: -950, width: 480, height: 320, color: "7e22ce" },
  { id: 6, x: 1370, y: -1080, width: 330, height: 410, color: "047857" },
  { id: 7, x: -1510, y: -420, width: 360, height: 440, color: "c2410c" },
  { id: 8, x: -900, y: -360, width: 500, height: 300, color: "0369a1" },
  { id: 9, x: -220, y: -500, width: 380, height: 380, color: "4338ca" },
  { id: 10, x: 420, y: -330, width: 440, height: 290, color: "b91c1c" },
  { id: 11, x: 1080, y: -440, width: 360, height: 420, color: "15803d" },
  { id: 12, x: -1710, y: 330, width: 460, height: 300, color: "9f1239" },
  { id: 13, x: -1060, y: 250, width: 330, height: 430, color: "075985" },
  { id: 14, x: -430, y: 390, width: 480, height: 320, color: "6d28d9" },
  { id: 15, x: 260, y: 260, width: 350, height: 440, color: "a21caf" },
  { id: 16, x: 900, y: 420, width: 500, height: 300, color: "0f766e" },
  { id: 17, x: -1380, y: 940, width: 400, height: 300, color: "b45309" },
  { id: 18, x: -700, y: 880, width: 320, height: 420, color: "1e40af" },
  { id: 19, x: 20, y: 980, width: 470, height: 300, color: "be123c" },
  { id: 20, x: 760, y: 900, width: 380, height: 430, color: "047857" },
];

const themes = [reactThemeLight, reactThemeDark];
const editorStyle: CSSProperties = { display: "block", width: "100%", height: "100%" };

export function InfiniteCanvasGalleryPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);

  async function onReady() {
    const editor = editorRef.current;
    if (!editor) return;

    const existing = await editor.getAllObjects();
    if (existing.length === 0) {
      const images = await Promise.all(artworks.map(async ({ id, x, y, width, height, color }) => {
        const image = await KritzelImage.fromUrl(
          `https://placehold.co/${width}x${height}/${color}/ffffff?text=Artwork+${id}`,
          { maxWidth: width, maxHeight: height },
        );
        image.translateX = x;
        image.translateY = y;
        image.isEditable = false;
        return image;
      }));
      await editor.addObjects(images);
    }

    const width = editor.getBoundingClientRect().width;
    await editor.setViewport(0, 100, width < 720 ? 0.13 : 0.22);
  }

  return (
    <KritzelEditor
      ref={editorRef}
      editorId="infinite-canvas-gallery"
      theme="light"
      themes={themes}
      isPanningEnabled
      isZoomingEnabled
      isToolbarVisible={false}
      isMoreMenuVisible={false}
      isWorkspaceManagerVisible={false}
      isUtilityPanelVisible={false}
      onIsReady={() => void onReady()}
      style={editorStyle}
    />
  );
}