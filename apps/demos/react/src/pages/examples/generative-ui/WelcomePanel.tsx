import { useState, type FormEvent } from "react";
import { detectProvider, getProvider, PROVIDERS, type Credentials, type ProviderId } from "./browser-transport";
import type { RequestMode } from "./generative-ui";
import { MOCK_UIS } from "./mock-transport";

/** The prompts of the canned UIs, so that every example also works with mocked requests. */
const EXAMPLE_PROMPTS = MOCK_UIS.map((ui) => ui.prompt);

export interface WelcomePanelProps {
  isVisible: boolean;
  mode: RequestMode | null;
  credentials: Credentials | null;
  error: string;
  onModeChange: (mode: RequestMode | null) => void;
  onConnect: (credentials: Credentials) => void;
  onDisconnect: () => void;
  onExample: (prompt: string) => void;
}

/** The empty-canvas guide, centered on the canvas until the first UI is added. It asks how to answer prompts and takes the API key. */
export function WelcomePanel({ isVisible, mode, credentials, error, onModeChange, onConnect, onDisconnect, onExample }: WelcomePanelProps) {
  const [providerId, setProviderId] = useState<ProviderId>("anthropic");
  const [apiKey, setApiKey] = useState("");
  const provider = getProvider(credentials?.provider ?? providerId);

  function updateKey(value: string) {
    setApiKey(value);
    const detected = detectProvider(value);
    if (detected) {
      setProviderId(detected);
    }
  }

  function connect(event: FormEvent) {
    event.preventDefault();
    if (apiKey.trim()) {
      onConnect({ provider: providerId, apiKey: apiKey.trim() });
      setApiKey("");
    }
  }

  const examples = (
    <ul className="welcome__examples" aria-label="Example prompts">
      {EXAMPLE_PROMPTS.map((prompt) => (
        <li key={prompt}>
          <button type="button" className="welcome__example" onClick={() => onExample(prompt)}>
            {`“${prompt}”`}
          </button>
        </li>
      ))}
    </ul>
  );

  const heading = (
    <>
      <p className="welcome__eyebrow">Generative UI</p>
      <h1 className="welcome__title">
        Describe an interface.
        <br />
        Watch it come to life.
      </h1>
    </>
  );

  if (mode === null) {
    return (
      <div className={`welcome${isVisible ? "" : " welcome--hidden"}`} aria-hidden={!isVisible}>
        <div className="welcome__content">
          {heading}
          <p className="welcome__hint">Generate UIs with a real model, or try the demo with mocked requests.</p>
          <div className="welcome__choices">
            <button type="button" className="welcome__choice welcome__choice--primary" onClick={() => onModeChange("live")}>
              <strong>Use a real API key</strong>
              <span>Describe any UI, with your own Anthropic, OpenAI or Gemini key.</span>
            </button>
            <button type="button" className="welcome__choice" onClick={() => onModeChange("mock")}>
              <strong>Mock the requests</strong>
              <span>Get canned UIs for the example prompts. No key needed.</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "mock") {
    return (
      <div className={`welcome${isVisible ? "" : " welcome--hidden"}`} aria-hidden={!isVisible}>
        <div className="welcome__content">
          {heading}
          <p className="welcome__hint">Pick an example or type into the chat box below. The UIs are canned, so no model is involved.</p>
          <div className="welcome__connected">
            <span>Mocked requests</span>
            <button type="button" className="welcome__change" onClick={() => onModeChange(null)}>
              Change
            </button>
          </div>
          {examples}
          <p className="welcome__footer">
            Press <kbd>▶</kbd> in a titlebar to open a UI in fullscreen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`welcome${isVisible ? "" : " welcome--hidden"}`} aria-hidden={!isVisible}>
      <div className="welcome__content">
        {heading}
        <p className="welcome__hint">
          {credentials
            ? "Type into the chat box below. The model builds a working UI on the canvas while you watch. Select a UI to ask for a change."
            : "Add your Anthropic, OpenAI or Gemini API key, then type into the chat box below."}
        </p>

        {credentials ? (
          <div className="welcome__connected">
            <span>{`Connected to ${provider.name} · ${provider.model}`}</span>
            <button type="button" className="welcome__change" onClick={onDisconnect}>
              Change key
            </button>
          </div>
        ) : (
          <form onSubmit={connect}>
            <label className="welcome__label" htmlFor="generative-ui-key">
              API key
            </label>
            <div className="welcome__providers" role="group" aria-label="Provider">
              {PROVIDERS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="welcome__provider"
                  aria-pressed={option.id === providerId}
                  onClick={() => setProviderId(option.id)}
                >
                  {option.name}
                </button>
              ))}
            </div>
            <div className="welcome__key-row">
              <input
                id="generative-ui-key"
                className="welcome__key"
                type="password"
                placeholder={provider.keyPlaceholder}
                autoComplete="off"
                spellCheck={false}
                value={apiKey}
                onChange={(event) => updateKey(event.target.value)}
              />
              <button type="submit" className="welcome__connect">
                Connect
              </button>
            </div>
            <p className="welcome__note">
              {`Kept in this tab's memory only and sent straight to ${provider.name}. `}
              <a href={provider.keyUrl} target="_blank" rel="noreferrer">
                Get a key
              </a>
            </p>
            <button type="button" className="welcome__change welcome__back" onClick={() => onModeChange(null)}>
              Back to the options
            </button>
          </form>
        )}
        {error && (
          <p className="welcome__error" role="alert">
            {error}
          </p>
        )}

        {examples}
        <p className="welcome__footer">
          Press <kbd>▶</kbd> in a titlebar to open a UI in fullscreen.
        </p>
      </div>
    </div>
  );
}
