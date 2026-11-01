import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import DomCanvasDemo from "./DomCanvasDemo";
import FramesDemo from "./FramesDemo";
import HeartBubbles from "./HeartBubbles";
import Icon, { ArrowIcon } from "./Icon";
import PerformanceDemo from "./PerformanceDemo";
import ThemesDemo from "./ThemesDemo";
import { WORDMARK_LETTERS } from "./paths";
import styles from "./styles.module.css";
import { InstallCommand } from "./InstallCommand";
import { docsPath, getPreferredFramework, usePreferredFramework } from "@site/src/utils/frameworkPreference";

export function CallToActionBar({ docsPath }: { docsPath: string }) {
  return (
    <div className={styles.ctaAnchor}>
      <div className={styles.ctaBar}>
        <Link href="https://app.kritzel.io" target="_blank" rel="noopener noreferrer" className={styles.ctaPrimary}>
          Demo <ArrowIcon />
        </Link>
        <Link to={docsPath} className={styles.ctaSecondary}>
          Get started <ArrowIcon />
        </Link>
        <InstallCommand />
      </div>
    </div>
  );
}

type Feature = { title: string; description: string; icon: ReactNode };

const FEATURES: ReadonlyArray<Feature> = [
  {
    title: "Open Source",
    description: "Kritzel is 100% open source and meant for everyone to use, modify, and build upon. Contributions, feedback, and new ideas are always welcome!",
    icon: (
      <>
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
      </>
    ),
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
    title: "Open Source",
    description: "Kritzel is 100% open source and meant for everyone to use, modify, and build upon. Contributions, feedback, and new ideas are always welcome!",
    icon: (
      <>
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
      </>
    ),
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
    <section aria-labelledby="features-heading" className={styles.features}>
      <h2 id="features-heading" className={styles.visuallyHidden}>
        Features
      </h2>
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

/** A docs page in the visitor's preferred framework, e.g. useDocsPath('advanced/dynamic-objects'). */
function useDocsPath(page: string): string {
  return docsPath(usePreferredFramework(), page);
}

type ShowcaseLinkProps = { label: string; to?: string; href?: string };

/** A text link with a trailing arrow; `href` opens an external page in a new tab. */
function ShowcaseLink({ label, to, href }: ShowcaseLinkProps) {
  const external = href ? { href, target: "_blank", rel: "noopener noreferrer" } : { to };
  return (
    <Link {...external} className={styles.showcaseLink}>
      {label}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    </Link>
  );
}

type ShowcaseProps = {
  headingId: string;
  title: string;
  description: string;
  media: ReactNode;
  link?: ShowcaseLinkProps;
  reversed?: boolean;
};

/** Media next to a heading, description and optional link; `reversed` puts the media on the right. */
function Showcase({ headingId, title, description, media, link, reversed = false }: ShowcaseProps) {
  return (
    <section aria-labelledby={headingId} className={styles.showcase} data-reversed={reversed ? "true" : undefined}>
      <div className={styles.showcaseInner}>
        {media}
        <div className={styles.showcaseCopy}>
          <h2 id={headingId} className={styles.sectionTitle}>
            {title}
          </h2>
          <p className={styles.sectionText}>{description}</p>
          {link && <ShowcaseLink {...link} />}
        </div>
      </div>
    </section>
  );
}

export function DomCanvasSection() {
  const dynamicObjectsPath = useDocsPath("advanced/dynamic-objects");

  return (
    <Showcase
      headingId="dom-canvas-heading"
      title="DOM based canvas"
      description="Unlike a classic HTML canvas, Kritzel renders real DOM nodes. Place full HTML elements like forms, videos or entire web apps on the board, and your users can interact with them just like anywhere else on the page."
      media={<DomCanvasDemo />}
      link={{ label: "Dynamic Objects", to: dynamicObjectsPath }}
    />
  );
}

export function PerformanceSection() {
  const performanceShowcasePath = useDocsPath("examples/performance-showcase");

  return (
    <Showcase
      headingId="performance-heading"
      title="Optimized for performance"
      description="Kritzel is designed from the ground up to handle hundreds of objects. It only renders what is currently in the viewport, so the board stays fast as your canvas grows."
      media={<PerformanceDemo />}
      link={{ label: "Full Demo", to: performanceShowcasePath }}
    />
  );
}

export function GenerativeUiSection() {
  const generativeUiPath = useDocsPath("examples/generative-ui");

  return (
    <Showcase
      headingId="generative-ui-heading"
      title="Build generative UI"
      description="Give your agent a set of ready-made components to build with. It assembles real, interactive UI right on the canvas, frame by frame, so you can watch it take shape and step in at any point."
      media={<FramesDemo />}
      link={{ label: "Full Demo", to: generativeUiPath }}
    />
  );
}

export function CustomizationSection() {
  const themesPath = useDocsPath("customization/themes");

  return (
    <Showcase
      headingId="customization-heading"
      title="Highly customizable"
      description="Adjust Kritzel's components to fit your product, down to their fonts, icons and labels. Start from the built-in light and dark themes or create your own, so the editor looks like part of your app."
      media={<ThemesDemo />}
      link={{ label: "Themes", to: themesPath }}
    />
  );
}

const KRITZEL_ASCII =`██╗  ██╗██████╗ ██╗████████╗███████╗███████╗██╗
██║ ██╔╝██╔══██╗██║╚══██╔══╝╚══███╔╝██╔════╝██║
█████╔╝ ██████╔╝██║   ██║     ███╔╝ █████╗  ██║
██╔═██╗ ██╔══██╗██║   ██║    ███╔╝  ██╔══╝  ██║
██║  ██╗██║  ██║██║   ██║   ███████╗███████╗███████╗
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝   ╚═╝   ╚══════╝╚══════╝╚══════╝`;

const SKILL_SESSION = {
  command: "npx skills add kasual1/kritzel",
  question: "Install the kritzel skill for your agent?",
} as const;

type CliVariant = "frameworks" | "skill";

/** The smallest setup of the editor in each framework, as in the framework's quick start. */
const CODE_FRAMEWORKS = [
  {
    id: "react",
    name: "React",
    logo: "/img/logo-react.svg",
    color: "#4a7dff",
    file: "Editor.tsx",
    code: `import { KritzelEditor } from '@kritzel/react-editor';

export function Editor() {
  return <KritzelEditor />;
}`,
  },
  {
    id: "vue",
    name: "Vue",
    logo: "/img/logo_vue.svg",
    color: "#42b883",
    file: "Editor.vue",
    code: `<script setup lang="ts">
import { KritzelEditor } from '@kritzel/vue-editor';
</script>

<template>
  <KritzelEditor />
</template>`,
  },
  {
    id: "angular",
    name: "Angular",
    logo: "/img/logo_angular.svg",
    color: "#dd0031",
    file: "editor.component.ts",
    code: `import { Component } from '@angular/core';
import { KritzelEditor } from '@kritzel/angular-editor';

@Component({
  selector: 'app-editor',
  imports: [KritzelEditor],
  template: \`<kritzel-editor />\`,
})
export class EditorComponent {}`,
  },
] as const;

type CodeState = {
  /** Index into CODE_FRAMEWORKS. */
  framework: number;
  /** How many characters of the framework's code are typed so far. */
  typed: number;
  typing: boolean;
  leaving: boolean;
  round: number;
};

/**
 * Types each framework's snippet in turn, starting with the visitor's preferred framework, once the editor
 * scrolls into view.
 */
function useCodeTyping(bodyRef: React.RefObject<HTMLDivElement | null>) {
  const [state, setState] = useState<CodeState>({
    framework: 0,
    typed: CODE_FRAMEWORKS[0].code.length,
    typing: false,
    leaving: false,
    round: 0,
  });

  useEffect(() => {
    const body = bodyRef.current;
    if (!body || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    const update = (patch: Partial<CodeState>) => setState((current) => ({ ...current, ...patch }));

    const run = (framework: number, round: number) => {
      timers.forEach(window.clearTimeout);
      timers = [];
      const { code } = CODE_FRAMEWORKS[framework];
      setState({ framework, typed: 0, typing: true, leaving: false, round });

      // Characters come quickly, with a short pause at the end of each line like a person typing.
      let t = 350;
      for (let i = 1; i <= code.length; i++) {
        t += code[i - 1] === "\n" ? 140 : 22;
        const typed = i;
        at(t, () => update({ typed }));
      }
      at(t + 75, () => update({ typing: false }));
      at(t + 2700, () => update({ leaving: true }));
      at(t + 2950, () => run((framework + 1) % CODE_FRAMEWORKS.length, round + 1));
    };

    let started = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!started && entries.some((entry) => entry.isIntersecting)) {
          started = true;
          observer.disconnect();
          const preferred = getPreferredFramework();
          run(Math.max(0, CODE_FRAMEWORKS.findIndex((option) => option.id === preferred)), 0);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(body);

    return () => {
      observer.disconnect();
      timers.forEach(window.clearTimeout);
    };
  }, [bodyRef]);

  return state;
}

const CODE_TOKEN =
  /('[^'\n]*'?|"[^"\n]*"?|`[^`\n]*`?)|\b(import|from|export|function|return|class|setup)\b|(@\w+)|(<\/?[A-Za-z][\w-]*|\/?>)/g;

/** A light syntax highlighting of a (partly typed) line of the snippets above. */
function highlight(line: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of line.matchAll(CODE_TOKEN)) {
    const [text, string, keyword, decorator] = match;
    const index = match.index ?? 0;
    if (index > last) {
      parts.push(line.slice(last, index));
    }
    const className = string
      ? styles.codeString
      : keyword
        ? styles.codeKeyword
        : decorator
          ? styles.codeDecorator
          : styles.codeTag;
    parts.push(
      <span key={index} className={className}>
        {text}
      </span>,
    );
    last = index + text.length;
  }
  if (last < line.length) {
    parts.push(line.slice(last));
  }
  return parts;
}

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

/** Replays the `npx skills add` session once the terminal scrolls into view. */
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
 * irregular intervals and happily hops and wiggles its arms when the pointer enters its tile.
 */
function BotIcon() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const eyesRef = useRef<SVGGElement | null>(null);
  const lidsRef = useRef<SVGGElement | null>(null);
  const blushFilterId = useId();
  const antennaRef = useRef<SVGGElement | null>(null);
  const leftArmRef = useRef<SVGPathElement | null>(null);
  const rightArmRef = useRef<SVGPathElement | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const leftArm = leftArmRef.current;
    const rightArm = rightArmRef.current;
    if (!svg || !leftArm || !rightArm || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const tile = svg.parentElement;
    if (!tile) {
      return;
    }

    // Both arms swing up around their shoulders and back a few times, mirroring each other.
    const wiggle = (arm: SVGPathElement, direction: 1 | -1) =>
      arm.animate(
        [0, 40, 5, 40, 5, 40, 0].map((angle) => ({ transform: `rotate(${direction * angle}deg)` })),
        { duration: 650, easing: "ease-in-out" },
      );

    // A little hop off the tile's floor: crouch, jump, land with a squash and settle. Its height, length, lean
    // and squash differ each time.
    const hop = () => {
      const height = between(8, 16);
      const lean = between(-8, 8);
      const squash = between(0.06, 0.12);
      const crouched = `scale(${1 + squash}, ${1 - squash})`;
      svg.animate(
        [
          { offset: 0, transform: "none", easing: "ease-out" },
          { offset: 0.15, transform: crouched, easing: "cubic-bezier(0.2, 0.7, 0.4, 1)" },
          {
            offset: 0.5,
            transform: `translateY(${-height}px) rotate(${lean}deg) scale(${1 - squash / 2}, ${1 + squash / 2})`,
            easing: "cubic-bezier(0.6, 0, 0.8, 0.3)",
          },
          { offset: 0.82, transform: crouched, easing: "ease-out" },
          { offset: 1, transform: "none" },
        ],
        { duration: between(420, 560) },
      );
    };

    let wiggling: Animation | undefined;
    const onPointerEnter = () => {
      if (wiggling?.playState === "running") {
        return;
      }
      hop();
      wiggling = wiggle(leftArm, 1);
      wiggle(rightArm, -1);
    };

    tile.addEventListener("pointerenter", onPointerEnter);
    return () => tile.removeEventListener("pointerenter", onPointerEnter);
  }, []);

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
      <defs>
        {/* Blurs the cheeks so the blush fades out smoothly instead of ending in a sharp edge. */}
        <filter id={blushFilterId} filterUnits="userSpaceOnUse" x="3" y="13" width="18" height="8" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
      </defs>
      <g ref={antennaRef} className={styles.skillAntennaSpin}>
        <path className={styles.skillAntenna} d="M12 8V4H8" />
      </g>
      {/* Before the face's outline, which covers whatever of the blur spreads past it. */}
      <g filter={`url(#${blushFilterId})`}>
        <ellipse className={styles.skillBlush} cx="7" cy="17.3" rx="1.6" ry="1" />
        <ellipse className={styles.skillBlush} cx="17" cy="17.3" rx="1.6" ry="1" />
      </g>
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path ref={leftArmRef} className={styles.skillArmLeft} d="M2 14h2" />
      <path ref={rightArmRef} className={styles.skillArmRight} d="M20 14h2" />
      <g ref={eyesRef} className={styles.skillEyes}>
        <g ref={lidsRef} className={styles.skillLids}>
          <path d="M15 13v2" />
          <path d="M9 13v2" />
        </g>
      </g>
    </svg>
  );
}

/** The mocked editor typing how Kritzel is added to a React, Vue or Angular app, framework by framework. */
function CodeWindow() {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const state = useCodeTyping(bodyRef);
  const framework = CODE_FRAMEWORKS[state.framework];
  const frameworkLogoUrl = useBaseUrl(framework.logo);
  const lines = framework.code.slice(0, state.typed).split("\n");

  return (
    <div className={styles.terminal}>
      <div className={styles.terminalBar}>
        <span className={styles.terminalDot} style={{ background: "#ff5f57" }} />
        <span className={styles.terminalDot} style={{ background: "#febc2e" }} />
        <span className={styles.terminalDot} style={{ background: "#28c840" }} />
        <span className={styles.codeFile}>{framework.file}</span>
      </div>
      <div ref={bodyRef} className={`${styles.terminalBody} ${styles.codeBody}`}>
        <pre className={styles.code} aria-label={`${framework.file}: ${framework.code}`}>
          {lines.map((line, index) => (
            <div key={index} className={styles.codeLine}>
              <span className={styles.codeLineNumber} aria-hidden="true">
                {index + 1}
              </span>
              <code className={styles.codeText}>
                {highlight(line)}
                {index === lines.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={`${styles.codeCursor} ${state.typing ? "" : styles.terminalCursorBlink}`}
                  />
                )}
              </code>
            </div>
          ))}
        </pre>
      </div>
      <div aria-label={`Framework: ${framework.name}`} className={styles.frameworkTileAnchor}>
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
    </div>
  );
}

/** The terminal replaying `npx skills add`, with the agent's bot hopping in the corner. */
function SkillTerminal() {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const state = useTerminalSession(terminalRef, SKILL_SESSION.command);

  return (
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
            <span className={styles.terminalMedium}>{SKILL_SESSION.question}</span>
            {state.answered && (
              <>
                {" "}
                <span className={styles.terminalPath}>›</span> <span className={styles.terminalAnswer}>Yes</span>
              </>
            )}
          </div>
        )}
        {state.added && (
          <div className={styles.terminalSuccess}>
            ✔ Added the <span className={styles.terminalStrong}>kritzel</span> skill to your agent
          </div>
        )}
        {state.prompt && (
          <div className={styles.terminalLine}>
            <span className={styles.terminalPath}>~/my-app</span>{" "}
            <span className={`${styles.terminalCursor} ${styles.terminalCursorBlink}`} />
          </div>
        )}
      </div>
      <div aria-hidden="true" className={styles.frameworkTileAnchor}>
        <HeartBubbles />
        <div className={styles.skillTileStatic}>
          <div className={`${styles.frameworkTile} ${styles.skillTile}`}>
            <BotIcon />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * How to add Kritzel to an app (`frameworks`) or to a coding agent (`skill`), either centered below its heading
 * (`stacked`) or as the media of a showcase row with the heading on the left (`split`).
 */
export function CliSection({ variant = "frameworks", layout = "stacked" }: { variant?: CliVariant; layout?: "stacked" | "split" }) {
  const isSkill = variant === "skill";
  const quickStartPath = useDocsPath("getting-started/quick-start");
  const title = isSkill ? "Agents love Kritzel" : "Easy to get started";
  const description = isSkill
    ? "Add the Kritzel skill to your coding agent, so it knows how to build and extend your canvas right away."
    : "Kritzel comes with ready-made templates, thorough docs and plenty of examples, so you can add it to your existing app in no time.";
  const terminal = isSkill ? <SkillTerminal /> : <CodeWindow />;

  if (layout === "split") {
    return (
      <Showcase
        headingId="cli-heading"
        title={title}
        description={description}
        media={<div className={styles.cliMedia}>{terminal}</div>}
        link={{ label: "Quick Start", to: quickStartPath }}
        reversed
      />
    );
  }

  return (
    <section aria-labelledby="cli-heading" className={styles.cli}>
      <div className={styles.sectionIntro}>
        <h2 id="cli-heading" className={styles.sectionTitle}>
          {title}
        </h2>
        <p className={styles.sectionText}>{description}</p>
      </div>
      {terminal}
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
      "Yes. Kritzel is open source under the MIT License, so you can use it for free in personal and commercial projects. The editor shows a small \"Powered by Kritzel\" badge by default; keeping it helps the project grow, but you can hide it with the isWatermarkVisible prop.",
  },
];

const AGENTIC_FAQ_ITEMS = [
  {
    question: "What makes a canvas agentic?",
    answer:
      "An agentic canvas lets your application give an AI agent control of the board. With Kritzel, your app can create, move, and delete objects, control the viewport, and respond to canvas changes through code.",
  },
  {
    question: "Can people see what an AI agent is doing?",
    answer:
      "Yes. Add an agentic cursor with a name, color, and status, then move it across the canvas or attach it to an object to show what the agent is working on. Agentic cursors are local to each client and are not synchronized to collaborators.",
  },
  {
    question: "Can people and agents work on the same canvas?",
    answer:
      "Yes. People can interact with the board while your application and agents make changes through Kritzel's API, so both can work with the same canvas objects.",
  },
  {
    question: "Which frameworks can I use to build an agentic canvas?",
    answer:
      "Kritzel supports React, Vue, Angular, and Vanilla JavaScript. Its Web Component-based engine and framework wrappers let you integrate an agentic canvas into your existing app.",
  },
  {
    question: "Is Kritzel free to use?",
    answer:
      "Yes. Kritzel is open source under the MIT License, including its agentic features, so you can build agentic canvases for free in personal and commercial projects. The \"Powered by Kritzel\" badge can be hidden with the isWatermarkVisible prop.",
  },
];

export function Faq({ variant = "default" }: { variant?: "default" | "agentic" }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqItems = variant === "agentic" ? AGENTIC_FAQ_ITEMS : FAQ_ITEMS;

  return (
    <section aria-labelledby="faq-heading" className={styles.faq}>
      <div className={styles.sectionIntro}>
        <h2 id="faq-heading" className={styles.sectionTitle}>
          Frequently Asked Questions
        </h2>
        <p className={styles.sectionText}>
          {variant === "agentic"
            ? "Answers to common questions about building agentic canvases with Kritzel."
            : "Answers to common questions about adopting Kritzel in production projects."}
        </p>
      </div>
      <div className={styles.faqList}>
        {faqItems.map((item, index) => {
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
              {/* Always rendered so answers are part of the server-rendered HTML that search engines index. */}
              <div
                id={`faq-answer-${index}`}
                role="region"
                aria-labelledby={`faq-question-${index}`}
                className={styles.faqAnswer}
                hidden={!isOpen}
              >
                {item.answer}
              </div>
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
