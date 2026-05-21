import {
  KritzelEditor,
  KritzelBrushTool,
  KritzelSelectionTool,
  KritzelEraserTool,
  KritzelToolbarControl,
} from "kritzel-react";

const controls: KritzelToolbarControl[] = [
  { type: "tool", tool: KritzelBrushTool, name: "Brush", icon: "brush", isDefault: true },
  { type: "separator", name: "separator-1" },
  { type: "tool", tool: KritzelEraserTool, name: "Eraser", icon: "eraser" },
  { type: "tool", tool: KritzelSelectionTool, name: "Selection", icon: "selection" },
];

export function CustomToolbar1Page() {
  return (
    <div className="app">
      <KritzelEditor controls={controls} />
    </div>
  );
}
