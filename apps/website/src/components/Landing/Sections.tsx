import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "@docusaurus/Link";
import Icon, { ArrowIcon } from "./Icon";
import { WORDMARK_LETTERS } from "./paths";
import styles from "./styles.module.css";

const INSTALL_COMMAND = "npm i kritzel";

export function CallToActionBar({ docsPath }: { docsPath: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timeout = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const copy = () => {
    navigator.clipboard?.writeText(INSTALL_COMMAND).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  };

  return (
    <div className={styles.ctaAnchor}>
      <div className={styles.ctaBar}>
        <Link href="https://app.kritzel.io" className={styles.ctaPrimary}>
          Demo <ArrowIcon />
        </Link>
        <Link to={docsPath} className={styles.ctaSecondary}>
          Get started <ArrowIcon />
        </Link>
        <div className={styles.ctaInstall}>
          <span className={styles.ctaPrompt}>$</span>
          <code className={styles.ctaCode}>{INSTALL_COMMAND}</code>
          <button
            type="button"
            className={styles.ctaCopy}
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
      </div>
    </div>
  );
}

const FEATURES: ReadonlyArray<{ title: string; description: string; icon: ReactNode }> = [
  {
    title: "Infinite",
    description:
      "Deploy an infinite canvas that expands with your users' creativity, allowing them to sketch, paint, or design without limits.",
    icon: <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z" />,
  },
  {
    title: "Realtime Collaboration",
    description:
      "Enable users to collaborate in real-time, making it easy for teams to work together on projects, share ideas, and see changes instantly.",
    icon: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    title: "Framework Agnostic",
    description:
      "Kritzel integrates seamlessly with any modern JavaScript framework like React, Vue or Angular. Focus on creativity, not compatibility.",
    icon: (
      <>
        <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
        <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
        <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
      </>
    ),
  },
  {
    title: "Customizable",
    description: "Tailor Kritzel to your needs with a wide range of customizable tools, brushes, and settings.",
    icon: <path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4" />,
  },
  {
    title: "Cross-Platform",
    description:
      "Kritzel features native support for desktop, tablet, and mobile devices. Build once and deliver a responsive canvas experience across all platforms.",
    icon: (
      <>
        <path d="M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8" />
        <path d="M10 19v-4" />
        <path d="M7 19h5" />
        <rect x="16" y="12" width="6" height="10" rx="2" />
      </>
    ),
  },
  {
    title: "AI Ready",
    description: "Enhance your agentic coding workflow with ready made skills and a dedicated MCP server.",
    icon: (
      <>
        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
        <path d="M20 3v4M22 5h-4M4 17v2M5 18H3" />
      </>
    ),
  },
];

export function Features() {
  return (
    <section aria-label="Features" className={styles.features}>
      <div className={styles.featuresGrid}>
        {FEATURES.map((feature) => (
          <article key={feature.title} className={styles.feature}>
            <div className={styles.featureIcon}>
              <Icon size={22}>{feature.icon}</Icon>
            </div>
            <h3 className={styles.featureTitle}>{feature.title}</h3>
            <p className={styles.featureText}>{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

const KRITZEL_ASCII = `██╗  ██╗██████╗ ██╗████████╗███████╗███████╗██╗
██║ ██╔╝██╔══██╗██║╚══██╔══╝╚══███╔╝██╔════╝██║
█████╔╝ ██████╔╝██║   ██║     ███╔╝ █████╗  ██║
██╔═██╗ ██╔══██╗██║   ██║    ███╔╝  ██╔══╝  ██║
██║  ██╗██║  ██║██║   ██║   ███████╗███████╗███████╗
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝   ╚═╝   ╚══════╝╚══════╝╚══════╝`;

const CLI_COMMAND = "npx kritzel init";

const CLI_FRAMEWORKS = [
  { name: "React", initial: "R", color: "#38c6ee" },
  { name: "Vue", initial: "V", color: "#42b883" },
  { name: "Angular", initial: "A", color: "#e8234a" },
] as const;

type TerminalState = {
  typed: string;
  typing: boolean;
  banner: boolean;
  question: boolean;
  answered: boolean;
  added: boolean;
  prompt: boolean;
  leaving: boolean;
  round: number;
};

const FINAL_STATE: TerminalState = {
  typed: CLI_COMMAND,
  typing: false,
  banner: true,
  question: true,
  answered: true,
  added: true,
  prompt: true,
  leaving: false,
  round: 0,
};

/** Replays a `npx kritzel init` session once the terminal scrolls into view. */
function useTerminalSession(terminalRef: React.RefObject<HTMLDivElement | null>) {
  const [state, setState] = useState<TerminalState>(FINAL_STATE);

  useEffect(() => {
    const terminal = terminalRef.current;
    if (!terminal || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    const update = (patch: Partial<TerminalState>) => setState((current) => ({ ...current, ...patch }));

    const run = (round: number) => {
      timers.forEach(window.clearTimeout);
      timers = [];
      setState({ ...FINAL_STATE, typed: "", typing: true, banner: false, question: false, answered: false, added: false, prompt: false, round });

      let t = 250;
      for (let i = 1; i <= CLI_COMMAND.length; i++) {
        at(t + i * 35, () => update({ typed: CLI_COMMAND.slice(0, i) }));
      }
      t += CLI_COMMAND.length * 35 + 75;
      at(t, () => update({ typing: false }));
      at(t + 225, () => update({ banner: true }));
      at(t + 650, () => update({ question: true }));
      t += 650 + 450;
      at(t, () => update({ answered: true }));
      at(t + 300, () => update({ added: true }));
      at(t + 500, () => update({ prompt: true }));
      at(t + 2700, () => update({ leaving: true }));
      at(t + 2950, () => run(round + 1));
    };

    let started = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!started && entries.some((entry) => entry.isIntersecting)) {
          started = true;
          observer.disconnect();
          run(0);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(terminal);

    return () => {
      observer.disconnect();
      timers.forEach(window.clearTimeout);
    };
  }, [terminalRef]);

  return state;
}

export function CliSection() {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const state = useTerminalSession(terminalRef);
  const framework = CLI_FRAMEWORKS[state.round % CLI_FRAMEWORKS.length];

  return (
    <section aria-labelledby="cli-heading" className={styles.cli}>
      <div className={styles.sectionIntro}>
        <h2 id="cli-heading" className={styles.sectionTitle}>
          Set up Kritzel in seconds
        </h2>
        <p className={styles.sectionText}>
          The Kritzel CLI installs and configures the canvas in your React, Vue or Angular project, so you can start
          building right away.
        </p>
      </div>
      <div className={styles.terminal}>
        <div className={styles.terminalBar}>
          <span className={styles.terminalDot} style={{ background: "#ff5f57" }} />
          <span className={styles.terminalDot} style={{ background: "#febc2e" }} />
          <span className={styles.terminalDot} style={{ background: "#28c840" }} />
        </div>
        <div ref={terminalRef} className={styles.terminalBody}>
          <div className={styles.terminalLine}>
            <span className={styles.terminalPath}>~/my-app</span> {state.typed}
            {state.typing && <span className={styles.terminalCursor} />}
          </div>
          {state.banner && (
            <div className={styles.terminalBanner}>
              <div aria-label="Kritzel" className={styles.terminalAscii}>
                {KRITZEL_ASCII}
              </div>
              <div className={styles.terminalWelcome}>
                Welcome to <span className={styles.terminalStrong}>kritzel.io</span>
              </div>
            </div>
          )}
          {state.question && (
            <div className={styles.terminalLine}>
              <span className={styles.terminalBold}>?</span>{" "}
              <span className={styles.terminalMedium}>Which framework do you want to use?</span>
              {state.answered && (
                <>
                  {" "}
                  <span className={styles.terminalPath}>›</span>{" "}
                  <span className={styles.terminalAnswer}>{framework.name}</span>
                </>
              )}
            </div>
          )}
          {state.added && (
            <div className={styles.terminalSuccess}>
              ✔ Added kritzel to your <span className={styles.terminalStrong}>{framework.name}</span> project
            </div>
          )}
          {state.prompt && (
            <div className={styles.terminalLine}>
              <span className={styles.terminalPath}>~/my-app</span>{" "}
              <span className={`${styles.terminalCursor} ${styles.terminalCursorBlink}`} />
            </div>
          )}
        </div>
        <div aria-label={`Selected framework: ${framework.name}`} className={styles.frameworkTileAnchor}>
          <div key={state.round} className={styles.frameworkTileMotion} data-leaving={state.leaving ? "true" : undefined}>
            <div className={styles.frameworkTile} style={{ background: framework.color }}>
              <span className={styles.frameworkInitial}>{framework.initial}</span>
              <span className={styles.frameworkName}>{framework.name}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const FAQ_ITEMS = [
  {
    question: "Which frameworks does Kritzel support?",
    answer:
      "Kritzel works seamlessly with React, Vue, Angular, and Vanilla JavaScript. Built on native Web Components with first-class TypeScript support, it provides dedicated framework wrappers so you can use native props and event handlers in your stack.",
  },
  {
    question: "Can Kritzel handle large, complex boards?",
    answer:
      "Yes. Kritzel is designed to handle large, complex boards. Using spatial indexing and viewport optimizations under the hood, it keeps panning and zooming responsive as your canvas grows.",
  },
  {
    question: "Is Kritzel an alternative to tldraw or Excalidraw?",
    answer:
      "Yes. Kritzel is a lightweight alternative to tldraw and Excalidraw, giving you a core canvas experience without the bloat of heavier engines.",
  },
  {
    question: "Does Kritzel support mobile devices, tablets, and trackpads?",
    answer:
      "Yes. Kritzel includes native gesture handling out of the box. It smoothly manages trackpad pinch-to-zoom, touch gestures on mobile/tablet screens, and traditional mouse wheel inputs across all major browsers.",
  },
  {
    question: "Is Kritzel free to use?",
    answer:
      "Kritzel is completely free for personal, open-source, and evaluation projects (which display a subtle watermark). For production SaaS apps and commercial deployments, you can purchase a Commercial License to remove the watermark.",
  },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section aria-labelledby="faq-heading" className={styles.faq}>
      <div className={styles.sectionIntro}>
        <h2 id="faq-heading" className={styles.sectionTitle}>
          Frequently Asked Questions
        </h2>
        <p className={styles.sectionText}>Answers to common questions about adopting Kritzel in production projects.</p>
      </div>
      <div className={styles.faqList}>
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={item.question} className={styles.faqItem}>
              <button
                type="button"
                id={`faq-question-${index}`}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${index}`}
                className={styles.faqButton}
                onClick={() => setOpenIndex(isOpen ? null : index)}
              >
                <span>{item.question}</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0a0a0a"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                  className={styles.faqIcon}
                  data-open={isOpen ? "true" : undefined}
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
              {isOpen && (
                <div id={`faq-answer-${index}`} role="region" aria-labelledby={`faq-question-${index}`} className={styles.faqAnswer}>
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function Wordmark() {
  return (
    <section aria-label="Kritzel" className={styles.wordmark}>
      <svg viewBox="-0.3 -0.3 51.6 10.6" width="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Kritzel" className={styles.wordmarkSvg}>
        <g fill="none" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="square">
          {WORDMARK_LETTERS.map((letter) => (
            <g key={letter.x} className={styles.wordmarkLetter}>
              <rect x={letter.x} y="0" width={letter.width} height="10" fill="transparent" stroke="none" />
              <path vectorEffect="non-scaling-stroke" d={letter.d} />
            </g>
          ))}
        </g>
      </svg>
    </section>
  );
}
