import { KritzelShape, ShapeType } from "@kritzel/react-editor";

/** A ProseMirror document with one paragraph per line. */
export function textDoc(text: string) {
  return {
    type: "doc",
    content: text.split("\n").map(line => ({ type: "paragraph", content: line ? [{ type: "text", text: line }] : [] })),
  };
}

export interface StickyNoteOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  fill: string;
  stroke: string;
  rotation?: number;
  shapeType?: ShapeType;
  fontSize?: number;
  fontColor?: string;
}

/** A shape that looks like a sticky note, with the same colors in light and dark mode. */
export function stickyNote({ x, y, width, height, text, fill, stroke, rotation = 0, shapeType = ShapeType.Rectangle, fontSize = 16, fontColor }: StickyNoteOptions) {
  const shape = new KritzelShape({
    translateX: x,
    translateY: y,
    width,
    height,
    rotation,
    shapeType,
    fillColor: { light: fill, dark: fill },
    strokeColor: { light: stroke, dark: stroke },
    strokeWidth: 2,
    fontSize,
    ...(fontColor ? { fontColor: { light: fontColor, dark: fontColor } } : {}),
  });
  if (text) {
    shape.setContent(textDoc(text));
  }
  return shape;
}

export const NOTE_COLORS = {
  yellow: { fill: "#fff3c4", stroke: "#e0a800" },
  pink: { fill: "#fde2ea", stroke: "#d6336c" },
  blue: { fill: "#dbeafe", stroke: "#2563eb" },
  green: { fill: "#dcfce7", stroke: "#16a34a" },
  violet: { fill: "#ede9fe", stroke: "#7c3aed" },
} as const;
