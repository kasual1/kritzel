import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  KritzelDynamicObjectRendererRegistry,
  KritzelEditor,
  KritzelWorkspace,
  type HTMLKritzelEditorElement,
  type KritzelSyncConfig,
} from "@kritzel/react-editor";
import { reactThemeDark } from "../../const/react-theme-dark";
import { reactThemeLight } from "../../const/react-theme-light";
import {
  createGithubStarObjects,
  DEFAULT_STAR_COUNT,
  GITHUB_STAR_RENDERER_KEY,
  mountGithubStarButton,
  normalizeGithubStarButtonData,
  STAR_COUNTS,
  type GithubStarButtonInstance,
} from "./github-star-button";

const themes = [reactThemeLight, reactThemeDark];

const hostStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  height: "100%",
  fontFamily: "Roboto, sans-serif",
};

const editorStyle: CSSProperties = {
  display: "block",
  width: "100%",
  height: "100%",
};

const overlayStyle: CSSProperties = {
  position: "absolute",
  top: "12px",
  right: "12px",
  zIndex: 10,
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "6px 8px",
  border: "1px solid #ebebeb",
  borderRadius: "8px",
  background: "#ffffff",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
  color: "#333333",
  fontSize: "13px",
};

function countButtonStyle(active: boolean): CSSProperties {
  return {
    padding: "4px 10px",
    border: `1px solid ${active ? "#4A7DFF" : "#d9d9d9"}`,
    borderRadius: "6px",
    background: active ? "#4A7DFF" : "#ffffff",
    color: active ? "#ffffff" : "#333333",
    fontSize: "13px",
    fontFamily: "inherit",
    cursor: "pointer",
  };
}

export function GithubStarsPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const mountedButtons = useRef(new Map<string, GithubStarButtonInstance>());
  const [starCount, setStarCount] = useState(DEFAULT_STAR_COUNT);
  const [isBusy, setIsBusy] = useState(false);

  const syncConfig = useMemo<KritzelSyncConfig>(() => ({ providers: [] }), []);
  const workspaces = useMemo(() => [new KritzelWorkspace({ objects: createGithubStarObjects(DEFAULT_STAR_COUNT) })], []);

  useEffect(() => {
    const buttons = mountedButtons.current;
    const destroy = (objectId: string, container: HTMLElement | null) => {
      buttons.get(objectId)?.destroy();
      buttons.delete(objectId);
      if (container) container.innerHTML = "";
    };
    KritzelDynamicObjectRendererRegistry.register(GITHUB_STAR_RENDERER_KEY, {
      onMount: ({ object, container, data }) => {
        if (!container) return;
        destroy(object.id, container);
        buttons.set(object.id, mountGithubStarButton(container, normalizeGithubStarButtonData(data)));
      },
      onSerialize: ({ object, data }) => buttons.get(object.id)?.getData() ?? normalizeGithubStarButtonData(data),
      onUnmount: ({ object, container, data }) => {
        const state = buttons.get(object.id)?.getData() ?? normalizeGithubStarButtonData(data);
        destroy(object.id, container);
        return state;
      },
    });
    return () => {
      buttons.forEach((instance) => instance.destroy());
      buttons.clear();
      KritzelDynamicObjectRendererRegistry.unregister(GITHUB_STAR_RENDERER_KEY);
    };
  }, []);

  async function changeStarCount(count: number) {
    const editor = editorRef.current;
    if (!editor || isBusy || count === starCount) return;

    setIsBusy(true);
    try {
      await editor.clearSelection();
      await editor.removeObjects(await editor.getAllObjects());
      await editor.addObjects(createGithubStarObjects(count));
      setStarCount(count);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div style={hostStyle}>
      <KritzelEditor
        ref={editorRef}
        editorId="examples-github-stars"
        theme="light"
        themes={themes}
        syncConfig={syncConfig}
        workspaces={workspaces}
        loginConfig={undefined}
        isPanningEnabled={true}
        isZoomingEnabled={true}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        style={editorStyle}
      />

      <div style={overlayStyle} role="group" aria-label="Number of star buttons">
        <span>Buttons</span>
        {STAR_COUNTS.map((count) => (
          <button
            key={count}
            type="button"
            aria-pressed={count === starCount}
            disabled={isBusy}
            onClick={() => void changeStarCount(count)}
            style={countButtonStyle(count === starCount)}
          >
            {count.toLocaleString("en-US")}
          </button>
        ))}
      </div>
    </div>
  );
}
