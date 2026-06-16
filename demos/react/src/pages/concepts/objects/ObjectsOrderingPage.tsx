import { useRef, useState } from "react";
import {
  KritzelEditor,
  HTMLKritzelEditorElement,
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

export function ObjectsOrderingPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [objects, setObjects] = useState<KritzelBaseObject<HTMLElement | SVGElement>[]>([]);

  async function refreshObjects() {
    const all = (await editorRef.current?.getAllObjects()) ?? [];
    setObjects([
      ...(all as KritzelBaseObject<HTMLElement | SVGElement>[]),
    ].sort((a, b) => a.zIndex - b.zIndex));
  }

  async function onReady() {
    if (!editorRef.current) {
      return;
    }

    await seedEditor(editorRef.current);

    const all = (await editorRef.current.getAllObjects()) ?? [];
    await Promise.all(
      all.map((obj) =>
        editorRef.current?.updateObject(obj, {
          translateX: obj.translateX - obj.centerX,
          translateY: obj.translateY - obj.centerY,
        }),
      ),
    );

    await refreshObjects();
  }

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        <button style={buttonStyle(false)} onClick={() => void editorRef.current?.getAllObjects().then((all) => editorRef.current?.selectObjects(all ?? []))}>Select All</button>
        <button style={buttonStyle(false)} onClick={() => void editorRef.current?.bringToFront().then(refreshObjects)}>Bring to Front</button>
        <button style={buttonStyle(false)} onClick={() => void editorRef.current?.bringForward().then(refreshObjects)}>Bring Forward</button>
        <button style={buttonStyle(false)} onClick={() => void editorRef.current?.sendBackward().then(refreshObjects)}>Send Backward</button>
        <button style={buttonStyle(false)} onClick={() => void editorRef.current?.sendToBack().then(refreshObjects)}>Send to Back</button>
      </div>
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <KritzelEditor
          ref={editorRef}
          editorId="objects-ordering"
          theme="react-theme"
          themes={[customReactTheme]}
          isPanningEnabled={false}
          isZoomingEnabled={false}
          isMoreMenuVisible={false}
          isWorkspaceManagerVisible={false}
          onIsReady={() => {
            void onReady();
          }}
          style={editorStyle}
        />
        <aside style={{ width: "200px", borderLeft: "1px solid #ebebeb", padding: "8px", overflowY: "auto", fontSize: "13px" }}>
          <h3 style={{ margin: "0 0 8px", fontSize: "14px" }}>Objects (z-order)</h3>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {objects.map((obj) => (
              <li key={obj.id} style={{ padding: "4px 0", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}>
                <span>{obj.__class__}</span>
                <span style={{ color: "#999", fontFamily: "monospace" }}>z:{obj.zIndex}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
