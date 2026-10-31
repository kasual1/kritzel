import { useState, type FormEvent } from "react";
import { detectProvider, getProvider, PROVIDERS, type Credentials, type ProviderId } from "./llm-providers";

const EXAMPLE_PROMPTS = [
  "A pomodoro timer with a circular progress ring",
  "A weather card for Lisbon with a 5-day forecast",
  "A kanban board for a product launch, with drag and drop",
];

export interface WelcomePanelProps {
  isVisible: boolean;
  credentials: Credentials | null;
  error: string;
  onConnect: (credentials: Credentials) => void;
  onDisconnect: () => void;
  onExample: (prompt: string) => void;
}

/** The empty-canvas placeholder: it explains the demo and asks for the API key, until the first UI is on the canvas. */
export function WelcomePanel({ isVisible, credentials, error, onConnect, onDisconnect, onExample }: WelcomePanelProps) {
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

  return (
    <div className={`welcome${isVisible ? "" : " welcome--hidden"}`} aria-hidden={!isVisible}>
      <div className="welcome__frame">
        <div className="welcome__titlebar">
          <span>New UI</span>
          <span>800 × 600</span>
        </div>
        <div className="welcome__card">
          <p className="welcome__eyebrow">Generative UI</p>
          <h1 className="welcome__title">
            Describe an interface.
            <br />
            Watch it come to life.
          </h1>
          <p className="welcome__hint">
            Type into the chat box below and an AI model builds a working UI right here on the canvas. Select a UI to
            change it.
          </p>

          {credentials ? (
            <div className="welcome__connected">
              <span>
                Connected to {provider.name} · {provider.model}
              </span>
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
                Kept in this tab&apos;s memory only and sent straight to {provider.name}.{" "}
                <a href={provider.keyUrl} target="_blank" rel="noreferrer">
                  Get a key
                </a>
              </p>
            </form>
          )}
          {error && (
            <p className="welcome__error" role="alert">
              {error}
            </p>
          )}

          <ul className="welcome__examples" aria-label="Example prompts">
            {EXAMPLE_PROMPTS.map((prompt) => (
              <li key={prompt}>
                <button type="button" className="welcome__example" onClick={() => onExample(prompt)}>
                  “{prompt}”
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
