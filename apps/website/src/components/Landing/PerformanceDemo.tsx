import type { CSSProperties } from "react";
import styles from "./styles.module.css";

/**
 * The board is tilted and scaled up by BOARD_SCALE so its corners stay covered (see .perfBoard). Sizes and
 * gaps below are in % of the board, divided by that scale so buttons still look 19% by 8.4% of the frame.
 */
const BOARD_SCALE = 1.2;
const OBJECT_WIDTH = 19 / BOARD_SCALE;
const OBJECT_HEIGHT = 8.4 / BOARD_SCALE;

const REPO_URL = "https://github.com/kasual1/kritzel";

/** The frame's height as a share of its width (the 16:11 .showcaseMedia), to turn widths into heights. */
const FRAME_ASPECT = 11 / 16;

/**
 * The buttons sit in tightly packed rows, every other row shifted by half a button like brickwork, and
 * spill past every edge. GAP is the same space between buttons in both directions, in % of the width.
 */
const GAP = 2.1 / BOARD_SCALE;
const COLUMN_PITCH = OBJECT_WIDTH + GAP;
const ROW_PITCH = OBJECT_HEIGHT + GAP / FRAME_ASPECT;
const FIRST_ROW_TOP = -3;
const ROW_STARTS = [GAP - COLUMN_PITCH / 2, GAP];

const OBJECTS: { x: number; y: number }[] = [];
for (let row = 0; FIRST_ROW_TOP + row * ROW_PITCH < 100; row++) {
  // One extra column on the right, so the slow drift to the left (.perfTrack) never shows a gap.
  for (let x = ROW_STARTS[row % 2]; x < 100 + COLUMN_PITCH; x += COLUMN_PITCH) {
    OBJECTS.push({ x, y: FIRST_ROW_TOP + row * ROW_PITCH });
  }
}

/** Opens the repository on GitHub; mouse only, since a board full of them would flood the tab order. */
function StarButton({ x, y }: { x: number; y: number }) {
  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={-1}
      className={`${styles.perfObject} ${styles.perfStar}`}
      style={{ left: `${x}%`, top: `${y}%`, width: `${OBJECT_WIDTH}%`, height: `${OBJECT_HEIGHT}%` }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
      </svg>
      Star
    </a>
  );
}

/** A mock canvas crowded with GitHub star buttons that slowly drift by. */
export default function PerformanceDemo() {
  return (
    <div aria-hidden="true" className={`${styles.showcaseMedia} ${styles.perfDemo}`}>
      <div className={styles.perfBoard}>
        <div className={styles.perfTrack} style={{ "--perf-pitch": `${COLUMN_PITCH}%` } as CSSProperties}>
          {OBJECTS.map((object, index) => (
            <StarButton key={index} x={object.x} y={object.y} />
          ))}
        </div>
      </div>
    </div>
  );
}
