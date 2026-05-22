import {
  KritzelEditor,
  KritzelBrushTool,
  KritzelSelectionTool,
  KritzelToolbarControl,
} from "kritzel-react";

const controls: KritzelToolbarControl[] = [
  { type: "tool", tool: KritzelSelectionTool, name: "Select", icon: "cursor", isDefault: true },
  { type: "tool", tool: KritzelBrushTool, name: "Brush", icon: "pen" },
];

export function CustomToolbar1Page() {
  return (
    <div className="app">
      <KritzelEditor controls={controls} />
    </div>
  );
}
