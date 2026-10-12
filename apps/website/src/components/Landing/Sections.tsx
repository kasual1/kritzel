import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import Icon, { ArrowIcon } from "./Icon";
import { WORDMARK_LETTERS } from "./paths";
import styles from "./styles.module.css";

const INSTALL_COMMAND = "npm i @kritzel/cli";

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
        <Link href="https://app.kritzel.io" target="_blank" rel="noopener noreferrer" className={styles.ctaPrimary}>
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

type Feature = { title: string; description: string; icon: ReactNode };

const FEATURES: ReadonlyArray<Feature> = [
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

const AGENTIC_FEATURES: ReadonlyArray<Feature> = [
  {
    title: "Ready made chatbox component",
    description:
      "Drop a chatbox onto the canvas that lets users talk to your agent right next to their work, with no extra UI to build.",
    icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  },
  {
    title: "Programmable cursors",
    description:
      "Give your agent its own cursor and move it across the canvas from code, so users can watch it draw, select and edit in real time.",
    icon: <path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z" />,
  },
  {
    title: "WebMCP ready",
    description:
      "Kritzel exposes the canvas as WebMCP tools, so browser agents can read, draw on and edit the whiteboard directly.",
    icon: (
      <>
        <path d="M12 22v-5" />
        <path d="M9 8V2" />
        <path d="M15 8V2" />
        <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" />
      </>
    ),
  },
  {
    title: "Dedicated Kritzel Skill",
    description:
      "Install the Kritzel skill with one command and your coding agent knows the Kritzel API, so it can build and extend your canvas for you.",
    icon: (
      <>
        <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
        <path d="M22 10v6" />
        <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
      </>
    ),
  },
  {
    title: "LLM generated objects",
    description:
      "Place dynamic objects on the canvas that render content generated by an LLM. Ask for a calculator and the generated web app lands on the board, ready to use.",
    icon: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="m10 9-3 3 3 3" />
        <path d="m14 15 3-3-3-3" />
      </>
    ),
  },
  {
    title: "Programmable canvas",
    description:
      "Drive the whole canvas from code: create, move and delete objects, control the viewport and react to every change, so your app and your agents stay in control.",
    icon: (
      <>
        <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1" />
        <path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1" />
      </>
    ),
  },
];

export function Features({ variant = "default" }: { variant?: "default" | "agentic" }) {
  const features = variant === "agentic" ? AGENTIC_FEATURES : FEATURES;

  return (
    <section aria-label="Features" className={styles.features}>
      <div className={styles.featuresGrid}>
        {features.map((feature) => (
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

const CLI_SESSIONS = {
  frameworks: {
    command: "npx kritzel init",
    question: "Which framework do you want to use?",
  },
  skill: {
    command: "npx skills add kasual1/kritzel",
    question: "Install the kritzel skill for your agent?",
  },
} as const;

type CliVariant = keyof typeof CLI_SESSIONS;

const CLI_FRAMEWORKS = [
  { name: "React", logo: "/img/logo-react.svg", color: "#4a7dff" },
  { name: "Vue", logo: "/img/logo_vue.svg", color: "#42b883" },
  { name: "Angular", logo: "/img/logo_angular.svg", color: "#dd0031" },
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

const FINAL_STATE: Omit<TerminalState, "typed"> = {
  typing: false,
  banner: true,
  question: true,
  answered: true,
  added: true,
  prompt: true,
  leaving: false,
  round: 0,
};

/** Replays a CLI session (`npx kritzel init` or `npx skills add`) once the terminal scrolls into view. */
function useTerminalSession(terminalRef: React.RefObject<HTMLDivElement | null>, command: string) {
  const [state, setState] = useState<TerminalState>({ ...FINAL_STATE, typed: command });

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
      for (let i = 1; i <= command.length; i++) {
        at(t + i * 35, () => update({ typed: command.slice(0, i) }));
      }
      t += command.length * 35 + 75;
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
  }, [terminalRef, command]);

  return state;
}

/** Random number in [min, max). */
const between = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * Lucide's bot icon whose eyes and antenna follow the pointer around the page. It blinks on its own at
 * irregular intervals.
 */
function BotIcon() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const eyesRef = useRef<SVGGElement | null>(null);
  const lidsRef = useRef<SVGGElement | null>(null);
  const antennaRef = useRef<SVGGElement | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const eyes = eyesRef.current;
    const antenna = antennaRef.current;
    if (!svg || !eyes || !antenna || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let frame = 0;
    const onPointerMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = svg.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        const distance = Math.hypot(dx, dy) || 1;
        // Ease towards the edge of the face as the pointer moves away, in viewBox units.
        const reach = Math.min(distance / 160, 1);
        eyes.style.transform = `translate(${(dx / distance) * reach * 2.5}px, ${(dy / distance) * reach * 1.75}px)`;
        // The antenna's tip points left by default and swings away from the pointer, so mirror it when the
        // pointer is to the left of the bot.
        antenna.style.transform = dx < 0 ? "scaleX(-1)" : "";
      });
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const lids = lidsRef.current;
    if (!lids || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let timer = 0;
    const schedule = () => {
      timer = window.setTimeout(blink, between(2500, 7000));
    };
    const blink = () => {
      // Mostly single blinks, with the occasional double.
      const times = Math.random() < 0.2 ? 2 : 1;
      const duration = between(140, 190);
      const closed = { transform: `scaleY(${between(0.05, 0.15)})` };
      const open = { transform: "scaleY(1)" };
      const keyframes = times === 1 ? [open, closed, open] : [open, closed, open, open, closed, open];
      lids.animate(keyframes, { duration: duration * times + (times - 1) * 60, easing: "ease-in-out" });
      schedule();
    };

    schedule();
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <svg
      ref={svgRef}
      className={styles.skillIcon}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g ref={antennaRef} className={styles.skillAntennaSpin}>
        <path className={styles.skillAntenna} d="M12 8V4H8" />
      </g>
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <g ref={eyesRef} className={styles.skillEyes}>
        <g ref={lidsRef} className={styles.skillLids}>
          <path d="M15 13v2" />
          <path d="M9 13v2" />
        </g>
      </g>
    </svg>
  );
}

export function CliSection({ variant = "frameworks" }: { variant?: CliVariant }) {
  const session = CLI_SESSIONS[variant];
  const isSkill = variant === "skill";
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const state = useTerminalSession(terminalRef, session.command);
  const framework = CLI_FRAMEWORKS[state.round % CLI_FRAMEWORKS.length];
  const frameworkLogoUrl = useBaseUrl(framework.logo);

  return (
    <section aria-labelledby="cli-heading" className={styles.cli}>
      <div className={styles.sectionIntro}>
        <h2 id="cli-heading" className={styles.sectionTitle}>
          {isSkill ? "Teach your agent Kritzel" : "Set up Kritzel in seconds"}
        </h2>
        <p className={styles.sectionText}>
          {isSkill
            ? "Add the Kritzel skill to your coding agent, so it knows how to build and extend your canvas right away."
            : "The Kritzel CLI installs and configures the canvas in your React, Vue or Angular project, so you can start building right away."}
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
              <span className={styles.terminalMedium}>{session.question}</span>
              {state.answered && (
                <>
                  {" "}
                  <span className={styles.terminalPath}>›</span>{" "}
                  <span className={styles.terminalAnswer}>{isSkill ? "Yes" : framework.name}</span>
                </>
              )}
            </div>
          )}
          {state.added && (
            <div className={styles.terminalSuccess}>
              {isSkill ? (
                <>
                  ✔ Added the <span className={styles.terminalStrong}>kritzel</span> skill to your agent
                </>
              ) : (
                <>
                  ✔ Added kritzel to your <span className={styles.terminalStrong}>{framework.name}</span> project
                </>
              )}
            </div>
          )}
          {state.prompt && (
            <div className={styles.terminalLine}>
              <span className={styles.terminalPath}>~/my-app</span>{" "}
              <span className={`${styles.terminalCursor} ${styles.terminalCursorBlink}`} />
            </div>
          )}
        </div>
        {isSkill ? (
          <div aria-hidden="true" className={styles.frameworkTileAnchor}>
            <div className={styles.skillTileStatic}>
              <div className={`${styles.frameworkTile} ${styles.skillTile}`}>
                <BotIcon />
              </div>
            </div>
          </div>
        ) : (
          <div aria-label={`Selected framework: ${framework.name}`} className={styles.frameworkTileAnchor}>
            <div key={state.round} className={styles.frameworkTileMotion} data-leaving={state.leaving ? "true" : undefined}>
              <div
                className={styles.frameworkTile}
                style={{ background: framework.color, boxShadow: `0 18px 20px -12px ${framework.color}40` }}
              >
                <img
                  className={styles.frameworkLogo}
                  data-framework={framework.name}
                  src={frameworkLogoUrl}
                  alt=""
                  width={88}
                  height={88}
                />
              </div>
            </div>
          </div>
        )}
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
