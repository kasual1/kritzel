import { useEffect, useRef, useState, type CSSProperties } from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";
import Icon from "./Icon";
import styles from "./InstallCommand.module.css";
import { setPreferredFramework, usePreferredFramework, type Framework } from "@site/src/utils/frameworkPreference";

const FRAMEWORKS: ReadonlyArray<{ id: Framework; name: string; logo: string; color: string }> = [
  { id: "react", name: "React", logo: "/img/logo-react.svg", color: "#4a7dff" },
  { id: "vue", name: "Vue", logo: "/img/logo_vue.svg", color: "#42b883" },
  { id: "angular", name: "Angular", logo: "/img/logo_angular.svg", color: "#dd0031" },
];

/** The logo files are white, so they are drawn as a mask over the framework's color. */
function FrameworkLogo({ logo, color }: { logo: string; color: string }) {
  const url = useBaseUrl(logo);
  const style: CSSProperties = { backgroundColor: color, maskImage: `url(${url})`, WebkitMaskImage: `url(${url})` };
  return <span className={styles.logo} style={style} aria-hidden="true" />;
}

/** The npm command of the visitor's preferred framework, with a dropdown to pick another framework and a copy button. */
export function InstallCommand() {
  const framework = usePreferredFramework();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  // The server cannot know the saved framework, so nothing framework-specific shows until the client does.
  const [isReady, setIsReady] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const selected = FRAMEWORKS.find((option) => option.id === framework) ?? FRAMEWORKS[0];
  const command = `npm i @kritzel/${selected.id}-editor`;

  useEffect(() => setIsReady(true), []);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timeout = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const select = (next: Framework) => {
    setPreferredFramework(next);
    setCopied(false);
    setIsOpen(false);
  };

  const copy = () => {
    navigator.clipboard?.writeText(command).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  };

  return (
    <div className={styles.install} data-ready={isReady ? "true" : undefined}>
      <div className={styles.picker} ref={pickerRef}>
        <button
          type="button"
          className={styles.trigger}
          aria-expanded={isOpen}
          aria-label={`Framework: ${selected.name}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <FrameworkLogo logo={selected.logo} color={selected.color} />
          <Icon size={14}>
            <path d="m6 9 6 6 6-6" />
          </Icon>
        </button>
        {isOpen && (
          <ul className={styles.menu}>
            {FRAMEWORKS.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  className={styles.option}
                  aria-current={option.id === framework ? "true" : undefined}
                  onClick={() => select(option.id)}
                >
                  <FrameworkLogo logo={option.logo} color={option.color} />
                  {option.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <span className={styles.prompt}>$</span>
      <code className={styles.code} title={command}>
        {command}
      </code>
      <button
        type="button"
        className={styles.copy}
        onClick={copy}
        aria-label={copied ? "Copied install command" : "Copy install command"}
      >
        {copied ? (
          <Icon size={16}>
            <path d="M20 6 9 17l-5-5" />
          </Icon>
        ) : (
          <Icon size={16}>
            <rect x="9" y="9" width="12" height="12" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </Icon>
        )}
      </button>
    </div>
  );
}
