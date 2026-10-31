import { useEffect, useLayoutEffect, useRef, useState, type Ref } from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";
import styles from "./styles.module.css";

/** Where the cursor is: off the canvas below its middle, at the desktop titlebar's add button or on the phone page. */
type Target = "offscreen" | "add" | "phone";

type BuildState = {
  /** Whether the desktop page has been generated; until then a loading placeholder fills its frame. */
  built: boolean;
  target: Target;
  /** Whether the cursor is pressing the add button. */
  pressed: boolean;
  /** Whether the phone variant has been added. */
  phone: boolean;
  /** Whether the phone page has been generated; until then a loading placeholder fills its frame. */
  phoneBuilt: boolean;
};

const FINAL_STATE: BuildState = {
  built: true,
  target: "phone",
  pressed: false,
  phone: true,
  phoneBuilt: true,
};

/**
 * Generates the desktop page once the demo scrolls into view, showing it all at once when it is ready. The
 * agent's cursor then moves in from the bottom and clicks the add button in the titlebar to add the phone
 * variant, which loads the same way, and the demo starts over. Until then, and with reduced motion, both are
 * complete.
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
      update({ built: false, target: "offscreen", pressed: false, phone: false, phoneBuilt: false });

      at(1500, () => update({ built: true }));
      at(2300, () => update({ target: "add" }));
      at(3700, () => update({ pressed: true }));
      at(3850, () => update({ pressed: false, phone: true }));
      at(4800, () => update({ target: "phone" }));
      at(5350, () => update({ phoneBuilt: true }));
      at(9400, run);
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

const FEATURES = ["Breathable mesh", "Cushioned sole", "Free returns"];

type FrameProps = {
  device: "desktop" | "phone";
  title: string;
  width?: string;
  active: boolean;
  hidden?: boolean;
  pressed?: boolean;
  addRef?: Ref<HTMLSpanElement>;
  pageRef?: Ref<HTMLDivElement>;
  children: React.ReactNode;
};

/** A frame on the mock canvas, with a titlebar like Kritzel's object titlebar above it. */
function Frame({ device, title, width, active, hidden, pressed, addRef, pageRef, children }: FrameProps) {
  return (
    <div
      className={styles.framesFrame}
      data-device={device}
      data-active={active ? "true" : undefined}
      data-hidden={hidden ? "true" : undefined}
    >
      <div className={styles.framesTitlebar}>
        <span className={styles.framesPlay}>
          <PlayIcon />
        </span>
        <span className={styles.framesTitle}>{title}</span>
        {width && <span className={styles.framesWidth}>{width}</span>}
        <span ref={addRef} className={styles.framesAdd} data-pressed={pressed ? "true" : undefined}>
          <PlusIcon />
        </span>
      </div>
      <div ref={pageRef} className={styles.framesPage}>
        {children}
      </div>
    </div>
  );
}

/** Where on a target the cursor's tip rests, as fractions of its width and height. */
const TIP: Record<"add" | "phone", [number, number]> = {
  add: [0.5, 0.5],
  phone: [0.6, 0.45],
};

/**
 * A mock canvas on which a product page for the red running shoe from the hero is generated in a desktop frame,
 * a loading placeholder until the whole page appears. An agent's cursor then adds a phone variant of it with the
 * add button in the frame's titlebar, which loads the same way.
 */
export default function FramesDemo() {
  // The hero's photo, so the page loads nothing extra for it.
  const shoeUrl = useBaseUrl("/img/red_running_shoe_3.jpg");
  const boxRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<HTMLDivElement | null>(null);
  const addRef = useRef<HTMLSpanElement | null>(null);
  const phoneRef = useRef<HTMLDivElement | null>(null);
  const state = useBuildSession(boxRef);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  // Points the cursor at its target, again whenever the demo resizes. The cursor moves with the frames when
  // the view pans, so it is placed relative to them.
  useLayoutEffect(() => {
    const box = boxRef.current;
    const world = worldRef.current;
    if (!box || !world) {
      return;
    }
    const measure = () => {
      const { target } = state;
      const origin = world.getBoundingClientRect();
      if (target === "offscreen") {
        // Below the demo's middle once the view has panned to the desktop frame (.framesWorld[data-solo]).
        setCursor({ x: box.clientWidth * 0.375, y: box.clientHeight + 40 });
        return;
      }
      const element = target === "add" ? addRef.current : phoneRef.current;
      if (!element) {
        return;
      }
      const [tipX, tipY] = TIP[target];
      const rect = element.getBoundingClientRect();
      setCursor({ x: rect.left - origin.left + rect.width * tipX, y: rect.top - origin.top + rect.height * tipY });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, [state.target]);

  return (
    <div ref={boxRef} aria-hidden="true" className={`${styles.showcaseMedia} ${styles.framesDemo}`}>
      <div ref={worldRef} className={styles.framesWorld} data-solo={state.phone ? undefined : "true"}>
        <Frame device="desktop" title="Desktop" width="1200" active={!state.phone} pressed={state.pressed} addRef={addRef}>
          <div data-built={state.built ? "true" : undefined} className={styles.framesBuild}>
            <div className={styles.siteNav}>
              <span className={styles.siteLogo}>
                <span className={styles.siteLogoMark} />
                Pace
              </span>
              <span className={styles.siteLinks}>
                <span>Men</span>
                <span>Women</span>
                <span>Sale</span>
              </span>
              <span className={`${styles.siteButton} ${styles.siteButtonDark}`}>Cart</span>
            </div>
            <div className={styles.siteHero}>
              <div>
                <div className={styles.siteHeadline}>Made for the long run.</div>
                <div className={styles.siteText}>
                  Breathable mesh, red accents and a cushioned sole for every mile.
                </div>
                <div className={styles.siteActions}>
                  <span className={styles.siteButton}>Buy now · $180</span>
                  <span className={`${styles.siteButton} ${styles.siteButtonOutline}`}>Find your size</span>
                </div>
              </div>
              <div className={styles.siteImage}>
                <img src={shoeUrl} alt="" loading="lazy" draggable={false} />
                <span className={styles.siteBadge}>New</span>
              </div>
            </div>
            <div className={styles.siteFeatures}>
              {FEATURES.map((feature) => (
                <span key={feature} className={styles.siteFeature}>
                  <span className={styles.siteFeatureIcon} />
                  {feature}
                </span>
              ))}
            </div>
          </div>
          <div className={styles.framesLoading} data-done={state.built ? "true" : undefined} />
        </Frame>
        <Frame device="phone" title="Phone" active={state.phone} hidden={!state.phone} pageRef={phoneRef}>
          <div data-built={state.phoneBuilt ? "true" : undefined} className={styles.framesBuild}>
            <div className={styles.siteNav}>
              <span className={styles.siteLogo}>
                <span className={styles.siteLogoMark} />
                Pace
              </span>
              <span className={styles.siteMenu} />
            </div>
            <div className={styles.siteHeadline}>Made for the long run.</div>
            <div className={styles.siteText}>
              Breathable mesh, red accents and a cushioned sole for every mile.
            </div>
            <div className={styles.siteActions}>
              <span className={styles.siteButton}>Buy now · $180</span>
            </div>
            <div className={styles.siteImage}>
              <img src={shoeUrl} alt="" loading="lazy" draggable={false} />
              <span className={styles.siteBadge}>New</span>
            </div>
            <div className={styles.siteFeatures}>
              {FEATURES.map((feature) => (
                <span key={feature} className={styles.siteFeature}>
                  <span className={styles.siteFeatureIcon} />
                  {feature}
                </span>
              ))}
            </div>
          </div>
          <div className={styles.framesLoading} data-done={state.phoneBuilt ? "true" : undefined} />
        </Frame>
        {cursor && (
          <div
            className={styles.framesCursor}
            data-hidden={state.target === "offscreen" ? "true" : undefined}
            data-pressed={state.pressed ? "true" : undefined}
            style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
          >
            <svg className={styles.framesCursorArrow} viewBox="0 0 24 24" fill="none">
              <path d="M5 3L19 12L12 13L9 20L5 3Z" fill="currentColor" stroke="#ffffff" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
