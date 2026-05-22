import {
  KritzelEditor,
  KritzelBrushTool,
  KritzelSelectionTool,
  KritzelToolbarControl,
  DEFAULT_BRUSH_CONFIG,
} from "kritzel-react";

const controls: KritzelToolbarControl[] = [
  { type: "tool", tool: KritzelSelectionTool, name: "Select", icon: "cursor" },
  { type: "tool", tool: KritzelBrushTool, name: "Brush", icon: "pen", isDefault: true, config: DEFAULT_BRUSH_CONFIG },
  { type: "config", name: "config" },
];

export function CustomToolbar2Page() {
  return (
    <div className="app">
      <KritzelEditor controls={controls} />
    </div>
  );
}
