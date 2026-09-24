import { useRef, useState } from "react";
import {
  HTMLKritzelEditorElement,
  KritzelEditor,
  KritzelPath,
  KritzelShape,
  KritzelWorkspace,
  ShapeType,
  type KritzelBaseObject,
} from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { createSeedObjects } from "../../getting-started/seed-objects";
import { buttonStyle, editorStyle, hostStyle, toolbarStyle } from "../../shared/demo-shared";

const themes = [reactThemeLight, reactThemeDark];

function randomOffset() {
  return Math.floor(Math.random() * 200) - 100;
}

export function ObjectsAddPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [objects, setObjects] = useState<KritzelBaseObject[]>([]);
  const [workspaces] = useState(() => [
    new KritzelWorkspace({ objects: createSeedObjects() }),
  ]);

  async function refreshObjects() {
    const editor = editorRef.current;
    if (!editor) return;
    setObjects(await editor.getAllObjects());
  }

  async function addRectangle() {
    const editor = editorRef.current;
    if (!editor) return;
    await editor.addObject(new KritzelShape({
      translateX: randomOffset(),
      translateY: randomOffset(),
      width: 120,
      height: 80,
      shapeType: ShapeType.Rectangle,
      fillColor: { light: "#e3f2fd", dark: "#1a237e" },
      strokeColor: { light: "#1565c0", dark: "#90caf9" },
      strokeWidth: 3,
    }));
    await refreshObjects();
  }

  async function addEllipse() {
    const editor = editorRef.current;
    if (!editor) return;
    await editor.addObject(new KritzelShape({
      translateX: randomOffset(),
      translateY: randomOffset(),
      width: 100,
      height: 100,
      shapeType: ShapeType.Ellipse,
      fillColor: { light: "#fce4ec", dark: "#880e4f" },
      strokeColor: { light: "#c62828", dark: "#ef9a9a" },
      strokeWidth: 3,
    }));
    await refreshObjects();
  }

  async function addPath() {
    const editor = editorRef.current;
    if (!editor) return;
    await editor.addObject(new KritzelPath({
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
    }));
    await refreshObjects();
  }

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        <button style={buttonStyle(false)} onClick={() => void addRectangle()}>Add Rectangle</button>
        <button style={buttonStyle(false)} onClick={() => void addEllipse()}>Add Ellipse</button>
        <button style={buttonStyle(false)} onClick={() => void addPath()}>Add Path</button>
        <span style={{ marginLeft: "auto", fontSize: "13px" }}>Objects: {objects.length}</span>
      </div>
      <KritzelEditor
        ref={editorRef}
        editorId="objects-add"
        theme="light"
        themes={themes}
        workspaces={workspaces}
        syncConfig={undefined}
        loginConfig={undefined}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        onIsReady={() => void refreshObjects()}
        style={editorStyle}
      />
    </div>
  );
}