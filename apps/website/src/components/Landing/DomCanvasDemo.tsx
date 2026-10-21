import {
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import Calculator from "./Calculator";
import { calculatorReducer, INITIAL_CALCULATOR_STATE } from "./calculator-state";
import styles from "./styles.module.css";

const KEY_STEP = 5;
/** Horizontal lean of the split line from its middle to either end, as a fraction of the width (--dom-tilt). */
const TILT = 0.1;

const clamp = (value: number) => Math.min(100, Math.max(0, value));

type Attributes = Record<string, string>;

function Attrs({ attrs }: { attrs: Attributes }) {
  return Object.entries(attrs).map(([name, value], index) => (
    <span key={name}>
      {index > 0 && " "}
      <span className={styles.domAttr}>{name}</span>
      <span className={styles.domPunct}>=</span>
      <span className={styles.domString}>"{value}"</span>
    </span>
  ));
}

/** An opening tag; with `unclosed` the `>` is left off so its attributes can continue on the next lines. */
function OpenTag({ name, attrs, unclosed }: { name: string; attrs?: Attributes; unclosed?: boolean }) {
  return (
    <>
      <span className={styles.domPunct}>&lt;</span>
      <span className={styles.domTag}>{name}</span>
      {attrs && (
        <>
          {" "}
          <Attrs attrs={attrs} />
        </>
      )}
      {!unclosed && <span className={styles.domPunct}>&gt;</span>}
    </>
  );
}

function CloseTag({ name }: { name: string }) {
  return (
    <>
      <span className={styles.domPunct}>&lt;/</span>
      <span className={styles.domTag}>{name}</span>
      <span className={styles.domPunct}>&gt;</span>
    </>
  );
}

function Line({ indent = 0, children }: { indent?: number; children: ReactNode }) {
  return (
    <div className={styles.domLine} style={{ paddingLeft: `${indent * 2}ch` }}>
      {children}
    </div>
  );
}

/**
 * A working calculator laid over a mock of the page that puts it on a Kritzel canvas. Dragging the split
 * bar wipes between the rendered canvas object and that DOM, whose value follows the calculator as you use it.
 */
export default function DomCanvasDemo() {
  const [state, dispatch] = useReducer(calculatorReducer, INITIAL_CALCULATOR_STATE);
  const [split, setSplit] = useState(50);
  const frameRef = useRef<HTMLDivElement | null>(null);

  const moveTo = (clientX: number) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (rect && rect.width > 0) {
      // The split travels TILT past each edge so the slanted line can clear the frame at either end.
      const x = (clientX - rect.left) / rect.width;
      setSplit(clamp(((x + TILT) / (1 + 2 * TILT)) * 100));
    }
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    moveTo(event.clientX);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      moveTo(event.clientX);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = {
      ArrowLeft: split - KEY_STEP,
      ArrowDown: split - KEY_STEP,
      ArrowRight: split + KEY_STEP,
      ArrowUp: split + KEY_STEP,
      Home: 0,
      End: 100,
    }[event.key];
    if (next !== undefined) {
      event.preventDefault();
      setSplit(clamp(next));
    }
  };

  return (
    <div ref={frameRef} className={`${styles.showcaseMedia} ${styles.domDemo}`} style={{ "--dom-split": split / 100 } as CSSProperties}>
      <div className={styles.domCanvasLayer}>
        <span className={styles.mediaBadge}>Canvas</span>
        <div className={styles.domCalculator}>
          <Calculator state={state} dispatch={dispatch} />
        </div>
      </div>
      <div aria-hidden="true" className={styles.domSourceLayer}>
        <span className={`${styles.mediaBadge} ${styles.domBadgeEnd}`}>DOM</span>
        <div className={styles.domCode}>
          <Line>
            <OpenTag name="html" />
          </Line>
          <Line indent={1}>
            <OpenTag name="head" />
          </Line>
          <Line indent={2}>
            <OpenTag name="script" attrs={{ src: "kritzel.js" }} />
            <CloseTag name="script" />
          </Line>
          <Line indent={1}>
            <CloseTag name="head" />
          </Line>
          <Line indent={1}>
            <OpenTag name="body" />
          </Line>
          <Line indent={2}>
            <OpenTag name="kritzel-editor" attrs={{ theme: "light" }} />
          </Line>
          <Line indent={3}>
            <OpenTag name="kritzel-dynamic-object" unclosed />
          </Line>
          <Line indent={4}>
            <Attrs attrs={{ x: "120", y: "80" }} />
            <span className={styles.domPunct}>&gt;</span>
          </Line>
          <Line indent={4}>
            <OpenTag name="app-calculator" attrs={{ value: state.display }} />
          </Line>
          <Line indent={4}>
            <CloseTag name="app-calculator" />
          </Line>
          <Line indent={3}>
            <CloseTag name="kritzel-dynamic-object" />
          </Line>
          <Line indent={2}>
            <CloseTag name="kritzel-editor" />
          </Line>
          <Line indent={1}>
            <CloseTag name="body" />
          </Line>
          <Line>
            <CloseTag name="html" />
          </Line>
        </div>
      </div>
      <div
        role="slider"
        tabIndex={0}
        aria-label="Reveal the DOM behind the canvas"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(split)}
        aria-valuetext={`${Math.round(100 - split)}% DOM visible`}
        className={styles.domHandle}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onKeyDown={onKeyDown}
      >
        <span className={styles.domHandleKnob}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m9 7-5 5 5 5" />
            <path d="m15 7 5 5-5 5" />
          </svg>
        </span>
      </div>
    </div>
  );
}
