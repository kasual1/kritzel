import { useMemo, useRef, useState, type ComponentProps } from "react";
import {
  HTMLKritzelEditorElement,
  KritzelEditor,
  KritzelWorkspace,
} from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { createSeedObjects } from "../../getting-started/seed-objects";
import { editorStyle, hostStyle, toolbarStyle } from "../../shared/demo-shared";

const themes = [reactThemeLight, reactThemeDark];
type MoreMenuItems = NonNullable<ComponentProps<typeof KritzelEditor>["moreMenuItems"]>;

export function MoreMenuOpenPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [isMoreMenuVisible, setIsMoreMenuVisible] = useState(true);
  const [workspaces] = useState(() => [
    new KritzelWorkspace({ objects: createSeedObjects() }),
  ]);
  const moreMenuItems = useMemo<MoreMenuItems>(
    () => [
      {
        id: "notify",
        label: "Show notification",
        icon: "settings",
        action: async () => {
          await editorRef.current?.triggerNotification({
            type: "info",
            message: "Opened from a custom More menu action",
          });
        },
      },
      {
        id: "center-content",
        label: "Center content",
        icon: "selectAll",
        action: async () => {
          await editorRef.current?.centerAllObjects();
        },
      },
    ],
    [],
  );

  async function onReady() {
    await editorRef.current?.openMoreMenu();
  }

  return (
    <div style={hostStyle}>
      <div style={toolbarStyle}>
        <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#333", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={isMoreMenuVisible}
            onChange={(event) => setIsMoreMenuVisible(event.currentTarget.checked)}
          />
          <span>More menu</span>
        </label>
      </div>
      <KritzelEditor
        ref={editorRef}
        editorId="more-menu-open"
        theme="light"
        themes={themes}
        workspaces={workspaces}
        syncConfig={undefined}
        loginConfig={undefined}
        moreMenuItems={moreMenuItems}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={isMoreMenuVisible}
        onIsReady={() => void onReady()}
        style={editorStyle}
      />
    </div>
  );
}