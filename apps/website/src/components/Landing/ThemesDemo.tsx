import { useEffect, useRef, useState, type CSSProperties } from "react";
import styles from "./styles.module.css";

/** Lengths are in cqw, so the themes scale with the demo. */
const THEMES: Record<`--theme-${string}`, string>[] = [
  // Kritzel's light theme.
  {
    "--theme-canvas": "#ffffff",
    "--theme-surface": "#ffffff",
    "--theme-field": "#f3f4f6",
    "--theme-border": "#e4e4e7",
    "--theme-border-width": "0.25cqw",
    "--theme-radius": "2.4cqw",
    "--theme-send-radius": "3.2cqw",
    "--theme-shadow": "0 0.8cqw 2.4cqw rgba(20, 18, 31, 0.1)",
    "--theme-ink": "#18181b",
    "--theme-muted": "#71717a",
    "--theme-accent": "#18181b",
    "--theme-on-accent": "#ffffff",
  },
  // Kritzel's dark theme.
  {
    "--theme-canvas": "#18181b",
    "--theme-surface": "#27272a",
    "--theme-field": "#3f3f46",
    "--theme-border": "#3f3f46",
    "--theme-border-width": "0.25cqw",
    "--theme-radius": "2.4cqw",
    "--theme-send-radius": "3.2cqw",
    "--theme-shadow": "0 0.8cqw 2.4cqw rgba(0, 0, 0, 0.4)",
    "--theme-ink": "#fafafa",
    "--theme-muted": "#a1a1aa",
    "--theme-accent": "#fafafa",
    "--theme-on-accent": "#18181b",
  },
  // Warm paper with soft, pill shaped controls.
  {
    "--theme-canvas": "#f6efe3",
    "--theme-surface": "#fffaf0",
    "--theme-field": "#f3e8d6",
    "--theme-border": "#e6d8c1",
    "--theme-border-width": "0.25cqw",
    "--theme-radius": "5cqw",
    "--theme-send-radius": "3.2cqw",
    "--theme-shadow": "0 1cqw 3cqw rgba(120, 85, 40, 0.18)",
    "--theme-ink": "#4a3423",
    "--theme-muted": "#8c7158",
    "--theme-accent": "#c8553d",
    "--theme-on-accent": "#fffaf0",
  },
  // Bold, square and with hard shadows.
  {
    "--theme-canvas": "#ffd84d",
    "--theme-surface": "#ffffff",
    "--theme-field": "#ffffff",
    "--theme-border": "#000000",
    "--theme-border-width": "0.5cqw",
    "--theme-radius": "0cqw",
    "--theme-send-radius": "0cqw",
    "--theme-shadow": "1cqw 1cqw 0 #000000",
    "--theme-ink": "#000000",
    "--theme-muted": "#3f3f46",
    "--theme-accent": "#ff4f79",
    "--theme-on-accent": "#000000",
  },
  // Deep blue with a glowing accent.
  {
    "--theme-canvas": "#0b1f3a",
    "--theme-surface": "#12305a",
    "--theme-field": "#0b1f3a",
    "--theme-border": "#2d5a91",
    "--theme-border-width": "0.25cqw",
    "--theme-radius": "1.4cqw",
    "--theme-send-radius": "1cqw",
    "--theme-shadow": "0 0 3cqw rgba(56, 189, 248, 0.3)",
    "--theme-ink": "#e0f2fe",
    "--theme-muted": "#8fb4d9",
    "--theme-accent": "#38bdf8",
    "--theme-on-accent": "#0b1f3a",
  },
];

const THEME_DURATION = 1600;

/** Moves on to the next theme every few seconds while the demo is on screen; stays light with reduced motion. */
function useThemeCycle(demoRef: React.RefObject<HTMLDivElement | null>) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const demo = demoRef.current;
    if (!demo || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let timer = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        window.clearInterval(timer);
        if (entries.some((entry) => entry.isIntersecting)) {
          timer = window.setInterval(() => setIndex((current) => (current + 1) % THEMES.length), THEME_DURATION);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(demo);

    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, [demoRef]);

  return THEMES[index];
}

/**
 * A mock canvas with Kritzel's workspace manager, more menu and a chat box, whose colors, corners, borders and
 * shadows morph from one theme into the next.
 */
export default function ThemesDemo() {
  const demoRef = useRef<HTMLDivElement | null>(null);
  const theme = useThemeCycle(demoRef);

  return (
    <div ref={demoRef} aria-hidden="true" className={`${styles.showcaseMedia} ${styles.themesDemo}`} style={theme as CSSProperties}>
      <div className={`${styles.themesControl} ${styles.themesWorkspaces}`}>
        <span className={styles.themesButton}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
        <span className={styles.themesDivider} />
        <span className={styles.themesButton}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </div>
      <div className={`${styles.themesControl} ${styles.themesMore}`}>
        <span className={styles.themesButton}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.75" />
            <circle cx="12" cy="12" r="1.75" />
            <circle cx="12" cy="19" r="1.75" />
          </svg>
        </span>
      </div>
      <div className={`${styles.themesControl} ${styles.themesChat}`}>
        <div className={styles.themesField}>
          <span className={styles.themesPrompt}>Describe what to build…</span>
          <span className={styles.themesSend}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M6 11l6-6 6 6" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}
