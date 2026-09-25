import { useRef } from "react";
import {
  KritzelBrushTool,
  KritzelEditor,
  KritzelLineTool,
  KritzelSelectionTool,
  KritzelShapeTool,
  KritzelTextTool,
  ShapeType,
  type HTMLKritzelEditorElement,
  type KritzelToolbarItem,
} from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { editorStyle, hostStyle, seedEditor } from "../../shared/demo-shared";

const themes = [reactThemeLight, reactThemeDark];

const toolbarItems: KritzelToolbarItem[] = [
  {
    name: "selection",
    type: "tool",
    tool: KritzelSelectionTool,
    icon: "cursor",
  },
  {
    name: "brush",
    type: "tool",
    tool: KritzelBrushTool,
    icon: "pen",
    isDefault: true,
    config: {
      color: { light: "#087ea4", dark: "#7dd3fc", label: "React Blue" },
      size: 8,
      opacity: 1,
      palette: [
        { light: "#087ea4", dark: "#7dd3fc", label: "React Blue" },
        { light: "#1f2937", dark: "#f3f4f6", label: "Ink" },
        { light: "#16a34a", dark: "#4ade80", label: "Green" },
      ],
      sizes: [4, 8, 16],
    },
  },
  {
    name: "line",
    type: "tool",
    tool: KritzelLineTool,
    icon: "arrow",
    config: {
      color: { light: "#0284c7", dark: "#38bdf8", label: "Sky" },
      size: 4,
      opacity: 0.8,
      palette: [
        { light: "#0284c7", dark: "#38bdf8", label: "Sky" },
        { light: "#16a34a", dark: "#4ade80", label: "Green" },
      ],
      sizes: [2, 4, 8],
      arrows: {
        start: { enabled: true, style: "circle" },
        end: { enabled: true, style: "triangle" },
      },
    },
  },
  {
    name: "shape",
    type: "tool",
    tool: KritzelShapeTool,
    icon: "shapeEllipse",
    config: {
      shapeType: ShapeType.Ellipse,
      fillColor: { light: "#e0f2fe", dark: "#0c4a6e" },
      strokeColor: { light: "#087ea4", dark: "#7dd3fc", label: "React Blue" },
      strokeWidth: 4,
      opacity: 1,
      fontColor: { light: "#1f2937", dark: "#f3f4f6", label: "Ink" },
      fontSize: 16,
      fontFamily: "Arial",
      palette: [
        { light: "#087ea4", dark: "#7dd3fc", label: "React Blue" },
        { light: "#f59e0b", dark: "#fbbf24", label: "Amber" },
        { light: "#1f2937", dark: "#f3f4f6", label: "Ink" },
      ],
      sizes: [2, 4, 8],
    },
    subOptions: [
      { id: "ellipse", icon: "shapeEllipse", label: "Ellipse", value: ShapeType.Ellipse, toolProperty: "shapeType" },
      { id: "rectangle", icon: "shapeRectangle", label: "Rectangle", value: ShapeType.Rectangle, toolProperty: "shapeType" },
    ],
  },
  {
    name: "text",
    type: "tool",
    tool: KritzelTextTool,
    icon: "type",
    config: {
      color: { light: "#1f2937", dark: "#f3f4f6", label: "Ink" },
      size: 12,
      fontFamily: "Georgia",
      availableFonts: ["Georgia", "Courier New"],
      palette: [
        { light: "#1f2937", dark: "#f3f4f6", label: "Ink" },
        { light: "#087ea4", dark: "#7dd3fc", label: "React Blue" },
      ],
      sizes: [8, 12, 24],
    },
  },
  {
    name: "config",
    type: "config",
  },
];

export function ToolsConfigPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);

  return (
    <div style={hostStyle}>
      <KritzelEditor
        ref={editorRef}
        editorId="tools-config"
        theme="light"
        themes={themes}
        syncConfig={undefined}
        loginConfig={undefined}
        toolbarItems={toolbarItems}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        onIsReady={() => {
          if (editorRef.current) {
            void seedEditor(editorRef.current);
          }
        }}
        style={editorStyle}
      />
    </div>
  );
}