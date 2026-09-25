import { useRef, useState } from "react";
import {
  HTMLKritzelEditorElement,
  KritzelEditor,
  KritzelWorkspace,
  type KritzelBaseObject,
} from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { createSeedObjects } from "../../getting-started/seed-objects";
import { buttonStyle, editorStyle, hostStyle, toolbarStyle } from "../../shared/demo-shared";

const themes = [reactThemeLight, reactThemeDark];

export function ObjectsFilterPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [results, setResults] = useState<KritzelBaseObject[]>([]);
  const [workspaces] = useState(() => [
    new KritzelWorkspace({ objects: createSeedObjects() }),
  ]);

  async function highlightResults(nextResults: KritzelBaseObject[]) {
    const editor = editorRef.current;
    if (!editor) return;
    const all = await editor.getAllObjects();
    await Promise.all(all.map((object) => editor.updateObject(object, { opacity: 0.5 })));
    await Promise.all(nextResults.map((object) => editor.updateObject(object, { opacity: 1 })));
  }

  async function showResults(nextResults: KritzelBaseObject[]) {
    setResults(nextResults);
    await highlightResults(nextResults);
  }

  async function queryAll() {
    const editor = editorRef.current;
    if (editor) await showResults(await editor.getAllObjects());
  }

  async function queryNone() {
    await showResults([]);
  }

  async function queryByType(className: string) {
    const editor = editorRef.current;
    if (editor) await showResults(await editor.findObjects((object) => object.__class__ === className));
  }

  async function queryInViewport() {
    const editor = editorRef.current;
    if (editor) await showResults(await editor.getObjectsInViewport());
  }

  async function onReady() {
    await highlightResults([]);
  }

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        <button style={buttonStyle(false)} onClick={() => void queryByType("KritzelShape")}>Shapes</button>
        <button style={buttonStyle(false)} onClick={() => void queryByType("KritzelPath")}>Paths</button>
        <button style={buttonStyle(false)} onClick={() => void queryByType("KritzelLine")}>Lines</button>
        <button style={buttonStyle(false)} onClick={() => void queryAll()}>All</button>
        <button style={buttonStyle(false)} onClick={() => void queryNone()}>None</button>
        <button style={buttonStyle(false)} onClick={() => void queryInViewport()}>In Viewport</button>
      </div>
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <KritzelEditor
          ref={editorRef}
          editorId="objects-filter"
          theme="light"
          themes={themes}
          workspaces={workspaces}
          syncConfig={undefined}
          loginConfig={undefined}
          isPanningEnabled={false}
          isZoomingEnabled={false}
          isMoreMenuVisible={false}
          isWorkspaceManagerVisible={false}
          onIsReady={() => void onReady()}
          style={editorStyle}
        />
        <aside style={{ width: "220px", borderLeft: "1px solid #ebebeb", padding: "8px", overflowY: "auto", fontSize: "13px" }}>
          <h3 style={{ margin: "0 0 8px", fontSize: "14px" }}>Objects</h3>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {results.length === 0 && <li style={{ color: "#999", fontStyle: "italic" }}>No results</li>}
            {results.map((object) => (
              <li key={object.id} style={{ padding: "4px 0", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#333", fontWeight: 500 }}>{object.__class__}</span>
                <span style={{ color: "#999", fontFamily: "monospace", fontSize: "11px" }}>{object.id.slice(0, 8)}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}