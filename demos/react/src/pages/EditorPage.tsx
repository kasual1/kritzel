import { DEFAULT_BRUSH_CONFIG, KritzelBrushTool, KritzelEditor, KritzelSelectionTool, KritzelToolbarControl } from "kritzel-react";

export function EditorPage() {

  const controls: KritzelToolbarControl[] = [
    {
      name: 'selection',
      type: 'tool',
      isDefault: true,
      tool: KritzelSelectionTool,
      icon: 'cursor',
    },
    {
      name: 'brush',
      type: 'tool',
      tool: KritzelBrushTool,
      icon: 'pen',
      config: DEFAULT_BRUSH_CONFIG,
    },
    {
      name: 'config',
      type: 'config',
    },
  ];
  
  return (
    <div className="app">
      <KritzelEditor controls={controls} />
    </div>
  );
}
