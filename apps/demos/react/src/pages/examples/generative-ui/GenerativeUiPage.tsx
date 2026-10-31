import { useCallback, useRef, useState } from "react";
import {
  KritzelEditor,
  KritzelWorkspace,
  type HTMLKritzelEditorElement,
  type KritzelObjectTitlebarActionEvent,
} from "@kritzel/react-editor";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { reactThemeLight } from "../../../const/react-theme-light";
import { createUiDocument, GenerativeUi, getUiTitle, isUi, objectConfig, objectTitlebar } from "./generative-ui";
import type { Credentials } from "./llm-providers";
import { UiPreview } from "./UiPreview";
import { WelcomePanel } from "./WelcomePanel";
import "./generative-ui.css";

const themes = [reactThemeLight, reactThemeDark];

interface Preview {
  title: string;
  document: string;
}

export function GenerativeUiPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const generatorRef = useRef<GenerativeUi | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // The key only lives in this component's memory: it is gone when the page reloads.
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [keyError, setKeyError] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [hasUis, setHasUis] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [workspaces] = useState(() => [new KritzelWorkspace({ name: "Generative UI", objects: [] })]);

  function onReady() {
    if (editorRef.current) {
      generatorRef.current = new GenerativeUi(editorRef.current);
    }
  }

  async function generate(prompt: string) {
    const generator = generatorRef.current;
    if (!generator || abortRef.current || !prompt.trim()) {
      return;
    }
    if (!credentials) {
      setKeyError("Add an API key to start generating UIs.");
      return;
    }

    const abort = new AbortController();
    abortRef.current = abort;
    setIsWorking(true);
    try {
      await generator.generate(prompt, credentials, abort.signal);
    } catch (error) {
      if (!abort.signal.aborted) {
        const message = error instanceof Error ? error.message : String(error);
        await editorRef.current?.triggerNotification({ type: "error", message });
      }
    } finally {
      abortRef.current = null;
      setIsWorking(false);
    }
  }

  function connect(next: Credentials) {
    setCredentials(next);
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
    <div className="generative-ui">
      <KritzelEditor
        ref={editorRef}
        className="generative-ui__editor"
        editorId="generative-ui"
        theme="light"
        themes={themes}
        workspaces={workspaces}
        objectConfig={objectConfig}
        objectTitlebar={objectTitlebar}
        isChatBoxVisible
        isChatBoxLoading={isWorking}
        isWorkspaceManagerVisible={false}
        onIsReady={onReady}
        onChatSubmit={(event) => void generate(event.detail)}
        onChatStop={() => abortRef.current?.abort()}
        onObjectsChange={(event) => setHasUis(event.detail.some(isUi))}
        onObjectTitlebarAction={(event) => void onTitlebarAction(event.detail)}
      />
      <WelcomePanel
        isVisible={!hasUis && !isWorking}
        credentials={credentials}
        error={keyError}
        onConnect={connect}
        onDisconnect={() => setCredentials(null)}
        onExample={(prompt) => void generate(prompt)}
      />
      {preview && <UiPreview title={preview.title} document={preview.document} onClose={closePreview} />}
    </div>
  );
}
