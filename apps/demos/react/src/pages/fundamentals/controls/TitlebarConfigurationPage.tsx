import { useRef, useState } from "react";
import {
  HTMLUpdrawEditorElement,
  UpdrawEditor,
  UpdrawShape,
  UpdrawWorkspace,
  ShapeType,
  type UpdrawObjectConfig,
  type UpdrawObjectTitlebarActionEvent,
  type UpdrawObjectTitlebarConfig,
} from "@updraw/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { editorStyle, hostStyle } from "../../shared/demo-shared";
import { Toolbar } from "../../../components/Toolbar";

const themes = [reactThemeLight, reactThemeDark];

const objectConfig: UpdrawObjectConfig = {
  // Only named frames get a titlebar.
  hasTitlebar: (object) => !!object.name,
  isRotatable: false,
  isResizable: false,
};

// Declared once and shared by every object accepted by `objectConfig.hasTitlebar`.
const objectTitlebar: UpdrawObjectTitlebarConfig = {
  left: [
    { id: "preview", type: "button", icon: "play", tooltip: "Preview", variant: "filled" },
    { id: "title", type: "title" },
    { id: "width", type: "text", tone: "muted", minBarWidth: 120, text: ({ contentSize }) => `${Math.round(contentSize.width)}` },
  ],
  right: [
    { id: "add-breakpoint", type: "button", icon: "plus", tooltip: "Add breakpoint" },
  ],
};

const actionLabels: Record<string, string> = {
  preview: "Preview",
  "add-breakpoint": "Add breakpoint",
};

// Frames keep their real pixel size and are drawn at 1/5 scale, like a zoomed-out design canvas.
const frameConfig = {
  shapeType: ShapeType.Rectangle,
  fillColor: { light: "#f5f6f7", dark: "#2b2c2f" },
  strokeColor: { light: "#f5f6f7", dark: "#2b2c2f" },
  strokeWidth: 5,
  scale: 5,
};

function createFrames() {
  return [
    new UpdrawShape({ ...frameConfig, name: "Desktop", translateX: -268, translateY: -130, width: 1200, height: 800 }),
    new UpdrawShape({ ...frameConfig, name: "Tablet", translateX: 4, translateY: -130, width: 768, height: 1024 }),
    new UpdrawShape({ ...frameConfig, name: "Phone", translateX: 190, translateY: -130, width: 390, height: 844 }),
  ];
}

export function TitlebarConfigurationPage() {
  const editorRef = useRef<HTMLUpdrawEditorElement | null>(null);
  const [lastAction, setLastAction] = useState("Click a titlebar button");
  const [workspaces] = useState(() => [
    new UpdrawWorkspace({ objects: createFrames() }),
  ]);

  async function onTitlebarAction(detail: UpdrawObjectTitlebarActionEvent) {
    const object = await editorRef.current?.getObjectById(detail.objectId);
    const label = actionLabels[detail.elementId] ?? detail.elementId;
    setLastAction(`${label} · ${object?.name ?? detail.objectType}`);
  }

  return (
    <div style={hostStyle}>
      <Toolbar>
        <span className="label">Last action:</span>
        <span className="status">{lastAction}</span>
      </Toolbar>
      <UpdrawEditor
        ref={editorRef}
        editorId="titlebar-configuration"
        theme="light"
        themes={themes}
        workspaces={workspaces}
        objectConfig={objectConfig}
        objectTitlebar={objectTitlebar}
        syncConfig={undefined}
        loginConfig={undefined}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        onObjectTitlebarAction={(event) => void onTitlebarAction(event.detail)}
        style={editorStyle}
      />
    </div>
  );
}
