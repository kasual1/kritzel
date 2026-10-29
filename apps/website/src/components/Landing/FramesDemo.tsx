import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type Ref } from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";
import styles from "./styles.module.css";

/** The parts of the page the agent builds, in order, and what its cursor says while it builds each one. */
const STEPS = [
  "Adding navigation",
  "Writing headline",
  "Writing intro",
  "Adding buttons",
  "Adding product photo",
  "Adding features",
] as const;

/** What the cursor points at: a part of the desktop page, the desktop titlebar's add button or the phone page. */
type Target = number | "add" | "phone";

type BuildState = {
  /** How many parts of the desktop page are built. */
  built: number;
  target: Target;
  /** The part outlined in the desktop frame, if any. */
  selected: number | null;
  /** The status under the cursor's name, if any. */
  status: string | null;
  /** Whether the cursor is pressing the add button. */
  pressed: boolean;
  /** Whether the phone variant has been added. */
  phone: boolean;
};

const FINAL_STATE: BuildState = {
  built: STEPS.length,
  target: "phone",
  selected: null,
  status: "Done",
  pressed: false,
  phone: true,
};

/**
 * Builds the desktop page part by part once the demo scrolls into view, then clicks the add button in its
 * titlebar to add the phone variant, and starts over. Until then, and with reduced motion, both are complete.
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
      update({ built: 0, target: 0, selected: null, status: null, pressed: false, phone: false });

      let t = 900;
      STEPS.forEach((status, index) => {
        at(t, () => update({ target: index, status }));
        at(t + 750, () => update({ built: index + 1, selected: index }));
        t += 1500;
      });
      at(t, () => update({ target: "add", selected: null, status: "Adding phone variant" }));
      at(t + 800, () => update({ pressed: true }));
      at(t + 950, () => update({ pressed: false, phone: true }));
      at(t + 2000, () => update({ target: "phone", status: "Done" }));
      at(t + 5500, run);
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
const TIP: Record<"part" | "add" | "phone", [number, number]> = {
  part: [0.7, 0.65],
  add: [0.5, 0.5],
  phone: [0.6, 0.45],
};

/**
 * A mock canvas on which an agent's cursor builds a product page for the red running shoe from the hero in a
 * desktop frame, part by part like a page taking shape in a design tool, and then adds a phone variant of it
 * with the add button in the frame's titlebar.
 */
export default function FramesDemo() {
  // The hero's photo, so the page loads nothing extra for it.
  const shoeUrl = useBaseUrl("/img/red_running_shoe_3.jpg");
  const boxRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<HTMLDivElement | null>(null);
  const partRefs = useRef<(HTMLElement | null)[]>([]);
  const addRef = useRef<HTMLSpanElement | null>(null);
  const phoneRef = useRef<HTMLDivElement | null>(null);
  const labelsRef = useRef<HTMLSpanElement | null>(null);
  const state = useBuildSession(boxRef);
  const [cursor, setCursor] = useState<{ x: number; y: number; flip: boolean } | null>(null);

  // Points the cursor at its target, again whenever the demo resizes. The cursor moves with the frames when
  // the view pans, so it is placed relative to them. Its labels go to the left of the arrow where they would
  // run past the demo's right edge, e.g. at the add button.
  useLayoutEffect(() => {
    const box = boxRef.current;
    const world = worldRef.current;
    if (!box || !world) {
      return;
    }
    const measure = () => {
      const { target } = state;
      const element = target === "add" ? addRef.current : target === "phone" ? phoneRef.current : partRefs.current[target];
      if (!element) {
        return;
      }
      const [tipX, tipY] = TIP[typeof target === "number" ? "part" : target];
      const origin = world.getBoundingClientRect();
      const rect = element.getBoundingClientRect();
      const x = rect.left - origin.left + rect.width * tipX;
      const labelsWidth = (labelsRef.current?.offsetWidth ?? 0) + 24;
      const flip = origin.left - box.getBoundingClientRect().left + x + labelsWidth > box.clientWidth;
      setCursor({ x, y: rect.top - origin.top + rect.height * tipY, flip });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, [state.target]);

  /** Build and selection attributes of a part of the desktop page, which the cursor works in. */
  const desktopPart = (index: number) => ({
    "data-built": state.built > index ? "true" : undefined,
    "data-selected": state.selected === index ? "true" : undefined,
    ref: (element: HTMLElement | null) => {
      partRefs.current[index] = element;
    },
  });

  /** The phone page arrives complete, its parts fading in one after another (--part sets the delay). */
  const phonePart = (index: number) => ({
    "data-built": state.phone ? "true" : undefined,
    style: { "--part": index } as CSSProperties,
  });

  return (
    <div ref={boxRef} aria-hidden="true" className={`${styles.showcaseMedia} ${styles.framesDemo}`}>
      <div ref={worldRef} className={styles.framesWorld} data-solo={state.phone ? undefined : "true"}>
        <Frame device="desktop" title="Desktop" width="1200" active={!state.phone} pressed={state.pressed} addRef={addRef}>
          <div {...desktopPart(0)} className={`${styles.framesBuild} ${styles.siteNav}`}>
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
              <div {...desktopPart(1)} className={`${styles.framesBuild} ${styles.siteHeadline}`}>
                Made for the long run.
              </div>
              <div {...desktopPart(2)} className={`${styles.framesBuild} ${styles.siteText}`}>
                Breathable mesh, red accents and a cushioned sole for every mile.
              </div>
              <div {...desktopPart(3)} className={`${styles.framesBuild} ${styles.siteActions}`}>
                <span className={styles.siteButton}>Buy now · $180</span>
                <span className={`${styles.siteButton} ${styles.siteButtonOutline}`}>Find your size</span>
              </div>
            </div>
            <div {...desktopPart(4)} className={`${styles.framesBuild} ${styles.siteImage}`}>
              <img src={shoeUrl} alt="" loading="lazy" draggable={false} />
              <span className={styles.siteBadge}>New</span>
            </div>
          </div>
          <div {...desktopPart(5)} className={`${styles.framesBuild} ${styles.siteFeatures}`}>
            {FEATURES.map((feature) => (
              <span key={feature} className={styles.siteFeature}>
                <span className={styles.siteFeatureIcon} />
                {feature}
              </span>
            ))}
          </div>
        </Frame>
        <Frame device="phone" title="Phone" active={state.phone} hidden={!state.phone} pageRef={phoneRef}>
          <div {...phonePart(0)} className={`${styles.framesBuild} ${styles.siteNav}`}>
            <span className={styles.siteLogo}>
              <span className={styles.siteLogoMark} />
              Pace
            </span>
            <span className={styles.siteMenu} />
          </div>
          <div {...phonePart(1)} className={`${styles.framesBuild} ${styles.siteHeadline}`}>
            Made for the long run.
          </div>
          <div {...phonePart(2)} className={`${styles.framesBuild} ${styles.siteText}`}>
            Breathable mesh, red accents and a cushioned sole for every mile.
          </div>
          <div {...phonePart(3)} className={`${styles.framesBuild} ${styles.siteActions}`}>
            <span className={styles.siteButton}>Buy now · $180</span>
          </div>
          <div {...phonePart(4)} className={`${styles.framesBuild} ${styles.siteImage}`}>
            <img src={shoeUrl} alt="" loading="lazy" draggable={false} />
            <span className={styles.siteBadge}>New</span>
          </div>
          <div {...phonePart(5)} className={`${styles.framesBuild} ${styles.siteFeatures}`}>
            {FEATURES.map((feature) => (
              <span key={feature} className={styles.siteFeature}>
                <span className={styles.siteFeatureIcon} />
                {feature}
              </span>
            ))}
          </div>
        </Frame>
        {cursor && (
          <div
            className={styles.framesCursor}
            data-pressed={state.pressed ? "true" : undefined}
            data-flip={cursor.flip ? "true" : undefined}
            style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
          >
            <svg className={styles.framesCursorArrow} viewBox="0 0 24 24" fill="none">
              <path d="M5 3L19 12L12 13L9 20L5 3Z" fill="currentColor" stroke="#ffffff" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            <span ref={labelsRef} className={styles.framesCursorLabels}>
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
    </div>
  );
}
