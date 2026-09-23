import { useRef } from "react";
import { HTMLKritzelEditorElement, KritzelEditor } from "@kritzel/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";
import { buttonStyle, editorStyle, hostStyle, toolbarStyle } from "../../shared/demo-shared";

export function NotificationsTriggerPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);

  async function notify(type: "info" | "warning" | "error") {
    await editorRef.current?.triggerNotification({
      type,
      message: `${type[0].toUpperCase()}${type.slice(1)} notification`,
    });
  }

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        <button style={buttonStyle(false)} onClick={() => void notify("info")}>Show info</button>
        <button style={buttonStyle(false)} onClick={() => void notify("warning")}>Show warning</button>
        <button style={buttonStyle(false)} onClick={() => void notify("error")}>Show error</button>
      </div>
      <KritzelEditor
        ref={editorRef}
        editorId="notifications-trigger"
        theme="light"
        themes={[reactThemeLight]}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        style={editorStyle}
      />
    </div>
  );
}