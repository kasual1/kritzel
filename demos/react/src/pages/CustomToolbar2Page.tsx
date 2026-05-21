import {
  KritzelEditor,
  KritzelBrushTool,
  KritzelLineTool,
  KritzelShapeTool,
  KritzelTextTool,
  KritzelSelectionTool,
  KritzelToolbarControl,
} from "kritzel-react";

const controls: KritzelToolbarControl[] = [
  { type: "tool", tool: KritzelSelectionTool, name: "Selection", icon: "selection", isDefault: true },
  { type: "separator", name: "separator-1" },
  { type: "tool", tool: KritzelBrushTool, name: "Brush", icon: "brush" },
  { type: "tool", tool: KritzelLineTool, name: "Line", icon: "line" },
  { type: "tool", tool: KritzelShapeTool, name: "Shape", icon: "shape" },
  { type: "tool", tool: KritzelTextTool, name: "Text", icon: "text" },
];

export function CustomToolbar2Page() {
  return (
    <div className="app">
      <KritzelEditor controls={controls} />
    </div>
  );
}
