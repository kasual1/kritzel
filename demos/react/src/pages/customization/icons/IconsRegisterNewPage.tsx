import { useRef } from "react";
import { KritzelBrushTool, KritzelEditor, KritzelSelectionTool, type ContextMenuItem, type HTMLKritzelEditorElement, type KritzelToolbarItem } from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { seedEditor } from "../../shared/demo-shared";

const customSvgIcons = {
  alien: '<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><path fill="#61dafb" d="M30 104h14v14H30zm54 0h14v14H84zM30 10h14v14H30zm54 0h14v14H84z"/><path fill="#087ea4" d="M98 64V37H84V24H71v13H57V24H44v13H30v27H17v13h13v14h14v13h13V91h14v13h13V91h14V77h13V64zM57 64H44V51h13zm27 0H71V51h13z"/></svg>',
};

const contextMenuItems: ContextMenuItem[] = [{ label: "Alien icon", icon: "alien", action: () => undefined }];
const toolbarItems: KritzelToolbarItem[] = [
  { name: "select", type: "tool", tool: KritzelSelectionTool, icon: "cursor", isDefault: true },
  {
    name: "brush",
    type: "tool",
    tool: KritzelBrushTool,
    icon: "pen",
    config: {
      color: { light: "#087ea4", dark: "#61dafb", label: "React Blue" },
      size: 8,
      opacity: 1,
      palette: [{ light: "#087ea4", dark: "#61dafb", label: "React Blue" }, { light: "#1f2937", dark: "#f3f4f6", label: "Ink" }],
      sizes: [4, 8, 16],
    },
  },
  { name: "alien", type: "tool", icon: "alien" },
];
const themes = [reactThemeLight, reactThemeDark];

export function IconsRegisterNewPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);

  async function onReady() {
    if (!editorRef.current) return;
    await seedEditor(editorRef.current);
    await editorRef.current.openContextMenu({ x: -50, y: -50 });
  }

  return (
    <KritzelEditor
      ref={editorRef}
      editorId="icons-register-new"
      customSvgIcons={customSvgIcons}
      toolbarItems={toolbarItems}
      globalContextMenuItems={contextMenuItems}
      theme="light"
      themes={themes}
      isPanningEnabled={false}
      isZoomingEnabled={false}
      isMoreMenuVisible={false}
      isWorkspaceManagerVisible={false}
      onIsReady={() => void onReady()}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}