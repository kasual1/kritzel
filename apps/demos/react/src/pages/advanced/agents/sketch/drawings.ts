import type { KritzelPoint } from "@kritzel/react-editor";

export interface Stroke {
  label: string;
  points: KritzelPoint[];
  color: string;
  width?: number;
}

export interface Drawing {
  name: string;
  strokes: Stroke[];
}

type Pair = [number, number];

/** A small, repeatable wobble, so the strokes look drawn by hand. */
function wobble(index: number, seed: number) {
  const value = Math.sin(index * 12.9898 + seed * 78.233) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
}

/** A polyline through the corners, with a point every ~12 units and a slight wobble. */
function lines(corners: Pair[], origin: Pair, seed = 1): KritzelPoint[] {
  const points: KritzelPoint[] = [];
  corners.forEach(([x, y], index) => {
    if (index === 0) {
      points.push({ x: x + origin[0], y: y + origin[1] });
      return;
    }
    const [px, py] = corners[index - 1];
    const steps = Math.max(1, Math.round(Math.hypot(x - px, y - py) / 12));
    for (let step = 1; step <= steps; step++) {
      const t = step / steps;
      const n = points.length;
      points.push({ x: px + (x - px) * t + origin[0] + wobble(n, seed) * 1.2, y: py + (y - py) * t + origin[1] + wobble(n, seed + 7) * 1.2 });
    }
  });
  return points;
}

/** A curve from a function of t in [0, 1]. */
function curve(at: (t: number) => Pair, origin: Pair, count = 48): KritzelPoint[] {
  return Array.from({ length: count + 1 }, (_, index) => {
    const [x, y] = at(index / count);
    return { x: x + origin[0], y: y + origin[1] };
  });
}

const TAU = Math.PI * 2;

export function house(origin: Pair): Drawing {
  return {
    name: "a house",
    strokes: [
      { label: "walls", color: "#92400e", width: 5, points: lines([[-160, -40], [-160, 180], [120, 180], [120, -40], [-160, -40]], origin, 1) },
      { label: "roof", color: "#dc2626", width: 6, points: lines([[-190, -30], [-20, -170], [150, -30]], origin, 2) },
      { label: "door", color: "#92400e", width: 5, points: lines([[-70, 180], [-70, 90], [-10, 90], [-10, 180]], origin, 3) },
      { label: "window", color: "#2563eb", width: 4, points: lines([[30, 20], [90, 20], [90, 75], [30, 75], [30, 20], [60, 20], [60, 75], [60, 47], [30, 47], [90, 47]], origin, 4) },
      { label: "chimney", color: "#dc2626", width: 5, points: lines([[60, -104], [60, -160], [95, -160], [95, -75]], origin, 5) },
      { label: "smoke", color: "#9ca3af", width: 4, points: curve(t => [78 + Math.sin(t * TAU * 1.5) * 16, -175 - t * 85], origin, 40) },
      { label: "sun", color: "#f59e0b", width: 5, points: curve(t => [-300 + Math.cos(t * TAU) * 36, -190 + Math.sin(t * TAU) * 36], origin, 40) },
      {
        label: "sunrays",
        color: "#f59e0b",
        width: 4,
        points: curve(t => {
          const angle = t * TAU;
          const radius = 46 + (Math.round(t * 32) % 2) * 18;
          return [-300 + Math.cos(angle) * radius, -190 + Math.sin(angle) * radius];
        }, origin, 32),
      },
      { label: "grass", color: "#16a34a", width: 5, points: curve(t => [-280 + t * 560, 186 + Math.sin(t * TAU * 6) * 6], origin, 72) },
    ],
  };
}

/** A lens-shaped leaf from the stem at (x, y): out along the upper edge, back along the lower one. */
function leaf(x: number, y: number, direction: 1 | -1, origin: Pair): KritzelPoint[] {
  const length = 85;
  const width = 20;
  const lift = 35;
  return curve(t => {
    const upper = t <= 0.5;
    const s = upper ? t * 2 : 2 - t * 2;
    const edge = Math.sin(s * Math.PI) * width * (upper ? -1 : 1);
    return [x + direction * length * s, y - lift * s + edge];
  }, origin, 40);
}

export function flower(origin: Pair): Drawing {
  return {
    name: "a flower",
    strokes: [
      { label: "stem", color: "#16a34a", width: 6, points: curve(t => [Math.sin(t * Math.PI) * 14, 210 - t * 210], origin, 30) },
      { label: "left leaf", color: "#16a34a", width: 5, points: leaf(6, 150, -1, origin) },
      { label: "right leaf", color: "#16a34a", width: 5, points: leaf(10, 100, 1, origin) },
      {
        label: "petals",
        color: "#db2777",
        width: 5,
        // A rose curve: six petals in one stroke.
        points: curve(t => {
          const angle = t * TAU;
          const radius = 95 * Math.abs(Math.cos(3 * angle));
          return [Math.cos(angle) * radius, Math.sin(angle) * radius];
        }, origin, 180),
      },
      { label: "center", color: "#f59e0b", width: 7, points: curve(t => [Math.cos(t * TAU * 2.2) * (6 + t * 16), Math.sin(t * TAU * 2.2) * (6 + t * 16)], origin, 40) },
    ],
  };
}
