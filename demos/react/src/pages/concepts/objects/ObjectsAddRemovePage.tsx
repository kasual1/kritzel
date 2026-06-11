import { useRef, useState } from "react";
import {
  KritzelEditor,
  KritzelPath,
  KritzelShape,
  ShapeType,
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

export function ObjectsAddRemovePage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [objects, setObjects] = useState<KritzelBaseObject<HTMLElement | SVGElement>[]>([]);

  async function refreshObjects() {
    const all = (await editorRef.current?.getAllObjects()) ?? [];
    setObjects(all as KritzelBaseObject<HTMLElement | SVGElement>[]);
  }

  function randomOffset() {
    return Math.floor(Math.random() * 200) - 100;
  }

  async function addRectangle() {
    await editorRef.current?.addObject(
      new KritzelShape({
        translateX: randomOffset(),
        translateY: randomOffset(),
        width: 120,
        height: 80,
        shapeType: ShapeType.Rectangle,
        fillColor: { light: "#e3f2fd", dark: "#1a237e" },
        strokeColor: { light: "#1565c0", dark: "#90caf9" },
        strokeWidth: 3,
      }),
    );
    await refreshObjects();
  }

  async function addEllipse() {
    await editorRef.current?.addObject(
      new KritzelShape({
        translateX: randomOffset(),
        translateY: randomOffset(),
        width: 100,
        height: 100,
        shapeType: ShapeType.Ellipse,
        fillColor: { light: "#fce4ec", dark: "#880e4f" },
        strokeColor: { light: "#c62828", dark: "#ef9a9a" },
        strokeWidth: 3,
      }),
    );
    await refreshObjects();
  }

  async function addPath() {
    await editorRef.current?.addObject(
      new KritzelPath({
        points: [
          [0, 0, 0.5],
          [20, -15, 0.5],
          [40, -30, 0.5],
          [60, -20, 0.5],
          [80, -10, 0.5],
          [100, -25, 0.5],
          [120, -40, 0.5],
        ],
        translateX: randomOffset(),
        translateY: randomOffset(),
        strokeWidth: 6,
        fill: { light: "#ff9800", dark: "#ffb74d" },
      }),
    );
    await refreshObjects();
  }

  async function removeLastObject() {
    const all = (await editorRef.current?.getAllObjects()) ?? [];
    if (all.length > 0) {
      await editorRef.current?.removeObject(all[all.length - 1]);
      await refreshObjects();
    }
  }

  async function onReady() {
    if (editorRef.current) {
      await seedEditor(editorRef.current);
      await refreshObjects();
    }
  }

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        <button style={buttonStyle(false)} onClick={() => void addRectangle()}>Add Rectangle</button>
        <button style={buttonStyle(false)} onClick={() => void addEllipse()}>Add Ellipse</button>
        <button style={buttonStyle(false)} onClick={() => void addPath()}>Add Path</button>
        <button style={buttonStyle(false)} onClick={() => void removeLastObject()} disabled={objects.length === 0}>Remove Last</button>
        <span style={{ marginLeft: "auto", fontSize: "13px" }}>Objects: {objects.length}</span>
      </div>
      <KritzelEditor
        ref={editorRef}
        editorId="objects-add-remove"
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
