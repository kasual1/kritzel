import styles from "./styles.module.css";

/** Buttons on the board. */
const OBJECT_COUNT = 110;

/** Object size in % of the frame, matching .perfObject. */
const OBJECT_WIDTH = 19;
const OBJECT_HEIGHT = 8.4;

const REPO_URL = "https://github.com/kasual1/kritzel";

/** How far an object may stick out past an edge, as a share of its size, so some are cut off like on a real board. */
const EDGE_OVERHANG = 0.6;

/** Seeded so the server-rendered board and the hydrated one place every button in the same spot. */
function seededRandom(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const random = seededRandom(2026);

const OBJECTS = Array.from({ length: OBJECT_COUNT }, () => ({
  x: -OBJECT_WIDTH * EDGE_OVERHANG + random() * (100 - OBJECT_WIDTH * (1 - 2 * EDGE_OVERHANG)),
  y: -OBJECT_HEIGHT * EDGE_OVERHANG + random() * (100 - OBJECT_HEIGHT * (1 - 2 * EDGE_OVERHANG)),
}));

/** Opens the repository on GitHub; mouse only, since a board full of them would flood the tab order. */
function StarButton({ x, y }: { x: number; y: number }) {
  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={-1}
      className={`${styles.perfObject} ${styles.perfStar}`}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
      </svg>
      Star
    </a>
  );
}

/** A mock canvas crowded with GitHub star buttons. */
export default function PerformanceDemo() {
  return (
    <div aria-hidden="true" className={`${styles.showcaseMedia} ${styles.perfDemo}`}>
      {OBJECTS.map((object, index) => (
        <StarButton key={index} x={object.x} y={object.y} />
      ))}
    </div>
  );
}
