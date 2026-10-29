import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./styles.module.css";

/** The parts of the page the agent builds, in order, and what its cursor says while it builds each one. */
const STEPS = [
  "Adding navigation",
  "Writing headline",
  "Writing intro",
  "Adding buttons",
  "Adding hero image",
  "Adding features",
] as const;

type BuildState = {
  /** How many parts are built. */
  built: number;
  /** The part the cursor points at. */
  target: number;
  /** The part outlined in the desktop frame, if any. */
  selected: number | null;
  /** The status under the cursor's name, if any. */
  status: string | null;
};

const FINAL_STATE: BuildState = { built: STEPS.length, target: STEPS.length - 1, selected: null, status: "Done" };

/**
 * Builds the page part by part once the demo scrolls into view, then starts over. Until then, and with
 * reduced motion, the page stays complete.
 */
function useBuildSession(frameRef: React.RefObject<HTMLDivElement | null>) {
  const [state, setState] = useState<BuildState>(FINAL_STATE);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    const update = (patch: Partial<BuildState>) => setState((current) => ({ ...current, ...patch }));

    const run = () => {
      timers.forEach(window.clearTimeout);
      timers = [];
      update({ built: 0, selected: null, status: null });

      let t = 600;
      STEPS.forEach((status, index) => {
        at(t, () => update({ target: index, status }));
        at(t + 750, () => update({ built: index + 1, selected: index }));
        t += 1500;
      });
      at(t, () => update({ selected: null, status: "Done" }));
      at(t + 3500, run);
    };

    let started = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!started && entries.some((entry) => entry.isIntersecting)) {
          started = true;
          observer.disconnect();
          run();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(frame);

    return () => {
      observer.disconnect();
      timers.forEach(window.clearTimeout);
    };
  }, [frameRef]);

  return state;
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/** A potted plant for the hero image. */
function Plant() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="46" r="30" fill="#c9e2cf" />
      <path d="M48 64C34 60 22 48 20 34c14 2 24 14 28 30Z" fill="#4c9a6c" />
      <path d="M52 64c14-4 26-16 28-30-14 2-24 14-28 30Z" fill="#3f8a5f" />
      <path d="M50 64c-10-14-10-34 0-50 10 16 10 36 0 50Z" fill="#2f7d55" />
      <path d="M47 66c-9 0-17-4-21-10 9-2 17 2 21 10Z" fill="#66b083" />
      <rect x="33" y="62" width="34" height="7" rx="2" fill="#c96a45" />
      <path d="M36 69h28l-4 19a2 2 0 0 1-2 2H42a2 2 0 0 1-2-2Z" fill="#e07f57" />
    </svg>
  );
}

const FEATURES = ["Pet friendly", "Free delivery", "Plant care"];

type FrameProps = {
  device: "desktop" | "phone";
  title: string;
  width?: string;
  active?: boolean;
  children: React.ReactNode;
};

/** A frame on the mock canvas, with a titlebar like Kritzel's object titlebar above it. */
function Frame({ device, title, width, active, children }: FrameProps) {
  return (
    <div className={styles.framesFrame} data-device={device} data-active={active ? "true" : undefined}>
      <div className={styles.framesTitlebar}>
        <span className={styles.framesPlay}>
          <PlayIcon />
        </span>
        <span className={styles.framesTitle}>{title}</span>
        {width && <span className={styles.framesWidth}>{width}</span>}
        <span className={styles.framesAdd}>
          <PlusIcon />
        </span>
      </div>
      <div className={styles.framesPage}>{children}</div>
    </div>
  );
}

/**
 * A mock canvas with a desktop and a phone frame, in which an agent's cursor builds a small website part by
 * part, like a page taking shape in a design tool. Each part appears in both frames at once.
 */
export default function FramesDemo() {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const partRefs = useRef<(HTMLElement | null)[]>([]);
  const state = useBuildSession(boxRef);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  // Points the cursor at its target part in the desktop frame, again whenever the demo resizes.
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) {
      return;
    }
    const measure = () => {
      const part = partRefs.current[state.target];
      if (!part) {
        return;
      }
      const frame = box.getBoundingClientRect();
      const rect = part.getBoundingClientRect();
      setCursor({ x: rect.left - frame.left + rect.width * 0.7, y: rect.top - frame.top + rect.height * 0.65 });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, [state.target]);

  /** Build and selection attributes of a part; `ref` only for the desktop frame, which the cursor works in. */
  const part = (index: number, desktop = false) => ({
    "data-built": state.built > index ? "true" : undefined,
    "data-selected": desktop && state.selected === index ? "true" : undefined,
    ref: desktop
      ? (element: HTMLElement | null) => {
          partRefs.current[index] = element;
        }
      : undefined,
  });

  return (
    <div ref={boxRef} aria-hidden="true" className={`${styles.showcaseMedia} ${styles.framesDemo}`}>
      <Frame device="desktop" title="Desktop" width="1200" active>
        <div {...part(0, true)} className={`${styles.framesBuild} ${styles.siteNav}`}>
          <span className={styles.siteLogo}>
            <span className={styles.siteLogoMark} />
            Fern
          </span>
          <span className={styles.siteLinks}>
            <span>Shop</span>
            <span>About</span>
            <span>Journal</span>
          </span>
          <span className={styles.siteButton}>Sign up</span>
        </div>
        <div className={styles.siteHero}>
          <div>
            <div {...part(1, true)} className={`${styles.framesBuild} ${styles.siteHeadline}`}>
              Plants that grow with you.
            </div>
            <div {...part(2, true)} className={`${styles.framesBuild} ${styles.siteText}`}>
              Hand-picked plants, delivered to your door with care tips for every leaf.
            </div>
            <div {...part(3, true)} className={`${styles.framesBuild} ${styles.siteActions}`}>
              <span className={styles.siteButton}>Shop plants</span>
              <span className={`${styles.siteButton} ${styles.siteButtonOutline}`}>How it works</span>
            </div>
          </div>
          <div {...part(4, true)} className={`${styles.framesBuild} ${styles.siteImage}`}>
            <Plant />
          </div>
        </div>
        <div {...part(5, true)} className={`${styles.framesBuild} ${styles.siteFeatures}`}>
          {FEATURES.map((feature) => (
            <span key={feature} className={styles.siteFeature}>
              <span className={styles.siteFeatureIcon} />
              {feature}
            </span>
          ))}
        </div>
      </Frame>
      <Frame device="phone" title="Phone">
        <div {...part(0)} className={`${styles.framesBuild} ${styles.siteNav}`}>
          <span className={styles.siteLogo}>
            <span className={styles.siteLogoMark} />
            Fern
          </span>
          <span className={styles.siteMenu} />
        </div>
        <div {...part(1)} className={`${styles.framesBuild} ${styles.siteHeadline}`}>
          Plants that grow with you.
        </div>
        <div {...part(2)} className={`${styles.framesBuild} ${styles.siteText}`}>
          Hand-picked plants, delivered to your door with care tips for every leaf.
        </div>
        <div {...part(3)} className={`${styles.framesBuild} ${styles.siteActions}`}>
          <span className={styles.siteButton}>Shop plants</span>
        </div>
        <div {...part(4)} className={`${styles.framesBuild} ${styles.siteImage}`}>
          <Plant />
        </div>
        <div {...part(5)} className={`${styles.framesBuild} ${styles.siteFeatures}`}>
          {FEATURES.map((feature) => (
            <span key={feature} className={styles.siteFeature}>
              <span className={styles.siteFeatureIcon} />
              {feature}
            </span>
          ))}
        </div>
      </Frame>
      {cursor && (
        <div className={styles.framesCursor} style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}>
          <svg className={styles.framesCursorArrow} viewBox="0 0 24 24" fill="none">
            <path d="M5 3L19 12L12 13L9 20L5 3Z" fill="currentColor" stroke="#ffffff" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
          <span className={styles.framesCursorLabels}>
            <span className={styles.framesCursorName}>Agent</span>
            {state.status && (
              <span key={state.status} className={styles.framesCursorStatus}>
                <span className={styles.framesCursorDot} />
                {state.status}
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
