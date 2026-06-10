import { useRef, useState } from "react";
import {
  KritzelEditor,
  type HTMLKritzelEditorElement,
  type KritzelBaseObject,
} from "kritzel-react";
import { customReactTheme } from "../../../const/custom-react-theme";
import {
  buttonStyle,
  editorStyle,
  hostStyle,
  seedEditor,
  toolbarStyle,
} from "../shared/concept-shared";

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
      <div style={toolbarStyle}>
        <button style={buttonStyle(false)} onClick={() => void centerOn(1)} disabled={objects.length < 2}>Center on Ellipsis</button>
        <button style={buttonStyle(false)} onClick={() => void centerOn(0)} disabled={objects.length === 0}>Center on Rectangle</button>
        <button style={buttonStyle(false)} onClick={() => void centerOn(2)} disabled={objects.length < 3}>Center on Line</button>
        <button style={buttonStyle(false)} onClick={() => void centerOn(3)} disabled={objects.length < 4}>Center on Path</button>
        <button style={buttonStyle(false)} onClick={() => void editorRef.current?.backToContent()}>Back to Content</button>
      </div>
      <KritzelEditor
        ref={editorRef}
        editorId="viewport-center"
        wheelEnabled={false}
        theme="react-theme"
        themes={[customReactTheme]}
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
