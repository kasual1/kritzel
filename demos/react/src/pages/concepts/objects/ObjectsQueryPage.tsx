import { useRef, useState } from "react";
import {
  KritzelEditor,
  HTMLKritzelEditorElement,
  type KritzelBaseObject,
} from "kritzel-react";
import { reactThemeLight } from "../../../const/react-theme-light";
import {
  buttonStyle,
  editorStyle,
  hostStyle,
  seedEditor,
  toolbarStyle,
} from "../shared/concept-shared";

export function ObjectsQueryPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [results, setResults] = useState<KritzelBaseObject<HTMLElement | SVGElement>[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  async function queryAll() {
    setResults(((await editorRef.current?.getAllObjects()) ?? []) as KritzelBaseObject<HTMLElement | SVGElement>[]);
    setTotalCount((await editorRef.current?.getObjectsTotalCount()) ?? 0);
  }

  async function queryByType(className: string) {
    setResults(
      ((await editorRef.current?.findObjects((obj) => obj.__class__ === className)) ?? []) as KritzelBaseObject<HTMLElement | SVGElement>[],
    );
    setTotalCount((await editorRef.current?.getObjectsTotalCount()) ?? 0);
  }

  async function queryInViewport() {
    setResults(((await editorRef.current?.getObjectsInViewport()) ?? []) as KritzelBaseObject<HTMLElement | SVGElement>[]);
    setTotalCount((await editorRef.current?.getObjectsTotalCount()) ?? 0);
  }

  async function onReady() {
    if (!editorRef.current) {
      return;
    }
    await seedEditor(editorRef.current);
    await queryAll();
  }

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        <button style={buttonStyle(false)} onClick={() => void queryAll()}>Get All</button>
        <button style={buttonStyle(false)} onClick={() => void queryByType("KritzelShape")}>Filter Shapes</button>
        <button style={buttonStyle(false)} onClick={() => void queryByType("KritzelPath")}>Filter Paths</button>
        <button style={buttonStyle(false)} onClick={() => void queryByType("KritzelLine")}>Filter Lines</button>
        <button style={buttonStyle(false)} onClick={() => void queryInViewport()}>In Viewport</button>
        <span style={{ marginLeft: "auto", fontSize: "13px" }}>Total: {totalCount}</span>
      </div>
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <KritzelEditor
          ref={editorRef}
          editorId="objects-query"
          theme="react-theme"
          themes={[reactThemeLight]}
          isPanningEnabled={false}
          isZoomingEnabled={false}
          isMoreMenuVisible={false}
          isWorkspaceManagerVisible={false}
          onIsReady={() => {
            void onReady();
          }}
          style={editorStyle}
        />
        <aside style={{ width: "220px", borderLeft: "1px solid #ebebeb", padding: "8px", overflowY: "auto", fontSize: "13px" }}>
          <h3 style={{ margin: "0 0 8px", fontSize: "14px" }}>Results ({results.length})</h3>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {results.length === 0 && <li style={{ color: "#999", fontStyle: "italic" }}>No results</li>}
            {results.map((obj) => (
              <li key={obj.id} style={{ padding: "4px 0", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}>
                <span>{obj.__class__}</span>
                <span style={{ color: "#999", fontFamily: "monospace" }}>{obj.id.slice(0, 8)}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
