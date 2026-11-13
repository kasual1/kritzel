import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import {
  KritzelEditor,
  KritzelWorkspace,
  type HTMLKritzelEditorElement,
  type KritzelChatBoxChip,
  type KritzelObjectTitlebarActionEvent,
} from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { createBrowserTransport, type Credentials } from "./browser-transport";
import {
  createGenerativeUiSession,
  createUiDocument,
  getErrorMessage,
  getUiChips,
  getUiTitle,
  isUi,
  objectConfig,
  objectTitlebar,
  withUiFrames,
  type RequestMode,
} from "./generative-ui";
import { createMockTransport } from "./mock-transport";
import { UiPreview } from "./UiPreview";
import { WelcomePanel } from "./WelcomePanel";
import "./generative-ui.css";

const themes = [withUiFrames(reactThemeLight), withUiFrames(reactThemeDark)];

/** The welcome guide takes its accent from the theme, like the editor's own controls. */
const accentStyle = {
  "--gen-ui-accent": reactThemeLight.global?.primaryColor,
  "--gen-ui-accent-hover": reactThemeLight.global?.primaryHoverColor,
} as CSSProperties;

interface Preview {
  title: string;
  document: string;
}

export function GenerativeUiPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  // The key only lives in this component's memory: it is gone when the page reloads.
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  // One session per mode, created once: choosing a mode binds its session to the editor.
  const [{ browser, sessions }] = useState(() => {
    const browser = createBrowserTransport();
    return {
      browser,
      sessions: { live: createGenerativeUiSession(browser.transport), mock: createGenerativeUiSession(createMockTransport()) },
    };
  });
  const [mode, setMode] = useState<RequestMode | null>(null);
  const [keyError, setKeyError] = useState("");
  const [hasUis, setHasUis] = useState(false);
  const [chips, setChips] = useState<KritzelChatBoxChip[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [workspaces] = useState(() => [new KritzelWorkspace({ name: "Generative UI", objects: [] })]);
  const session = mode ? sessions[mode] : null;
  const subscribe = useCallback((onChange: () => void) => session?.on("change", onChange) ?? (() => {}), [session]);
  const isWorking = useSyncExternalStore(subscribe, () => session?.running ?? false);

  // The chat box shows the progress of a prompt, but not why it failed.
  useEffect(
    () =>
      session?.on("end", (result) => {
        if (result.status === "error") {
          void editorRef.current?.triggerNotification({ type: "error", message: getErrorMessage(result.error) });
        }
      }),
    [session],
  );

  function sendExample(prompt: string) {
    if (mode === "live" && !credentials) {
      setKeyError("Add an API key to start generating UIs.");
      return;
    }
    void session?.send(prompt);
  }

  function connect(next: Credentials) {
    browser.setCredentials(next);
    setCredentials(next);
    setKeyError("");
  }

  function disconnect() {
    browser.setCredentials(null);
    setCredentials(null);
  }

  function changeMode(next: RequestMode | null) {
    setMode(next);
    setKeyError("");
  }

  async function onTitlebarAction({ elementId, objectId }: KritzelObjectTitlebarActionEvent) {
    const ui = await editorRef.current?.getObjectById(objectId);
    if (elementId === "play" && ui && isUi(ui) && !ui.isLoading) {
      setPreview({ title: getUiTitle(ui), document: createUiDocument(ui.content, getUiTitle(ui)) });
    }
  }

  const closePreview = useCallback(() => setPreview(null), []);

  return (
    <div className="generative-ui" style={accentStyle}>
      <KritzelEditor
        ref={editorRef}
        className="generative-ui__editor"
        editorId="generative-ui"
        theme="light"
        themes={themes}
        workspaces={workspaces}
        objectConfig={objectConfig}
        objectTitlebar={objectTitlebar}
        chatSession={session}
        chatBoxChips={chips}
        isChatBoxVisible={mode === "mock" || credentials !== null}
        isToolbarVisible={false}
        isWorkspaceManagerVisible={false}
        onObjectsChange={(event) => setHasUis(event.detail.some(isUi))}
        onObjectsSelectionChange={(event) => setChips(getUiChips(event.detail))}
        onChatChipRemove={(event) => setChips((current) => current.filter((chip) => chip.id !== event.detail.id))}
        onObjectTitlebarAction={(event) => void onTitlebarAction(event.detail)}
      />
      <WelcomePanel
        isVisible={!hasUis && !isWorking}
        mode={mode}
        credentials={credentials}
        error={keyError}
        onModeChange={changeMode}
        onConnect={connect}
        onDisconnect={disconnect}
        onExample={sendExample}
      />
      {preview && <UiPreview title={preview.title} document={preview.document} onClose={closePreview} />}
    </div>
  );
}
