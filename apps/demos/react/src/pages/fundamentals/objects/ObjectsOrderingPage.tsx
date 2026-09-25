import { useRef, useState } from "react";
import {
  KritzelEditor,
  HTMLKritzelEditorElement,
  KritzelWorkspace,
  type KritzelBaseObject,
} from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { createSeedObjects } from "../../getting-started/seed-objects";
import {
  buttonStyle,
  editorStyle,
  hostStyle,
  toolbarStyle,
} from "../../shared/demo-shared";

const themes = [reactThemeLight, reactThemeDark];

function createOverlappingSeedObjects() {
  return createSeedObjects().map((object) => {
    object.translateX -= object.centerX;
    object.translateY -= object.centerY;
    return object;
  });
}

export function ObjectsOrderingPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [seedObjects] = useState(createOverlappingSeedObjects);
  const [objects, setObjects] = useState<KritzelBaseObject<HTMLElement | SVGElement>[]>(seedObjects);
  const [workspaces] = useState(() => [new KritzelWorkspace({ objects: seedObjects })]);

  async function refreshObjects() {
    const all = (await editorRef.current?.findObjects((object) => object.__class__ !== "KritzelSelectionBox")) ?? [];
    setObjects([
      ...(all as KritzelBaseObject<HTMLElement | SVGElement>[]),
    ].sort((a, b) => a.zIndex - b.zIndex));
  }

  async function selectAll() {
    const editor = editorRef.current;
    if (!editor) return;
    await editor.selectObjects(await editor.getAllObjects());
  }

  async function reorder(action: "bringToFront" | "bringForward" | "sendBackward" | "sendToBack") {
    const editor = editorRef.current;
    if (!editor) return;
    await editor[action]();
    await refreshObjects();
  }

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        <button style={buttonStyle(false)} onClick={() => void selectAll()}>Select All</button>
        <button style={buttonStyle(false)} onClick={() => void reorder("bringToFront")}>Bring to Front</button>
        <button style={buttonStyle(false)} onClick={() => void reorder("bringForward")}>Bring Forward</button>
        <button style={buttonStyle(false)} onClick={() => void reorder("sendBackward")}>Send Backward</button>
        <button style={buttonStyle(false)} onClick={() => void reorder("sendToBack")}>Send to Back</button>
      </div>
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <KritzelEditor
          ref={editorRef}
          editorId="objects-ordering"
          theme="light"
          themes={themes}
          workspaces={workspaces}
          syncConfig={undefined}
          loginConfig={undefined}
          isPanningEnabled={false}
          isZoomingEnabled={false}
          isMoreMenuVisible={false}
          isWorkspaceManagerVisible={false}
          onObjectsSelectionChange={() => void refreshObjects()}
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
