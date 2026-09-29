import { useRef, useState } from "react";
import {
  HTMLKritzelEditorElement,
  KritzelEditor,
  KritzelWorkspace,
} from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { createSeedObjects } from "../../getting-started/seed-objects";
import { editorStyle, hostStyle } from "../../shared/demo-shared";
import { Toolbar } from "../../../components/Toolbar";

const themes = [reactThemeLight, reactThemeDark];

export function NotificationsTriggerPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [workspaces] = useState(() => [
    new KritzelWorkspace({ objects: createSeedObjects() }),
  ]);

  async function notify(type: "info" | "warning" | "error") {
    await editorRef.current?.triggerNotification({
      type,
      message: `${type[0].toUpperCase()}${type.slice(1)} notification`,
    });
  }

  return (
    <div style={hostStyle}>
      <Toolbar>
        <button onClick={() => void notify("info")}>Show info</button>
        <button onClick={() => void notify("warning")}>Show warning</button>
        <button onClick={() => void notify("error")}>Show error</button>
      </Toolbar>
      <KritzelEditor
        ref={editorRef}
        editorId="notifications-trigger"
        theme="light"
        themes={themes}
        workspaces={workspaces}
        syncConfig={undefined}
        loginConfig={undefined}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        style={editorStyle}
      />
    </div>
  );
}