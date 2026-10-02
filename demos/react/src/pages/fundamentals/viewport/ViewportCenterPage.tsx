import { useRef, useState } from "react";
import {
  KritzelEditor,
  type HTMLKritzelEditorElement,
  type KritzelBaseObject,
} from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import {
  editorStyle,
  hostStyle,
  seedEditor,
} from "../../shared/demo-shared";
import { Toolbar } from "../../../components/Toolbar";

const themes = [reactThemeLight, reactThemeDark];

export function ViewportCenterPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [objects, setObjects] = useState<KritzelBaseObject<HTMLElement | SVGElement>[]>([]);

  async function onReady() {
    if (!editorRef.current) {
      return;
    }

    await seedEditor(editorRef.current);
    setObjects(((await editorRef.current.getAllObjects()) ?? []) as KritzelBaseObject<HTMLElement | SVGElement>[]);
  }

  async function centerOn(index: number) {
    if (objects[index]) {
      await editorRef.current?.centerObjects([objects[index]]);
    }
  }

  return (
    <div style={hostStyle}>
      <Toolbar>
        <button onClick={() => void centerOn(1)} disabled={objects.length < 2}>Center on Ellipsis</button>
        <button onClick={() => void centerOn(0)} disabled={objects.length === 0}>Center on Rectangle</button>
        <button onClick={() => void centerOn(2)} disabled={objects.length < 3}>Center on Line</button>
        <button onClick={() => void centerOn(3)} disabled={objects.length < 4}>Center on Path</button>
        <button onClick={() => void editorRef.current?.backToContent()}>Back to Content</button>
      </Toolbar>
      <KritzelEditor
        ref={editorRef}
        editorId="viewport-center"
        theme="light"
        themes={themes}
        syncConfig={undefined}
        loginConfig={undefined}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        onIsReady={() => {
          void onReady();
        }}
        style={editorStyle}
      />
    </div>
  );
}
