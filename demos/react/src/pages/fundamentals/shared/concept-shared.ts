import type { CSSProperties } from "react";
import type { KritzelBaseObject } from "kritzel-react";
import { createSeedObjects } from "../../basic-usage/seed-objects";

export const hostStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  fontFamily: "Roboto, sans-serif",
};

export const toolbarStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 12px",
  background: "#f5f5f5",
  borderBottom: "1px solid #ebebeb",
  flexWrap: "wrap",
};

export const statusBarStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "8px 12px",
  background: "#f5f5f5",
  borderTop: "1px solid #ebebeb",
  fontSize: "13px",
};

export const editorStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: "block",
};

export function buttonStyle(active = false): CSSProperties {
  return {
    padding: "6px 12px",
    border: `1px solid ${active ? "#087ea4" : "#d9d9d9"}`,
    borderRadius: "6px",
    background: active ? "#087ea4" : "#ffffff",
    color: active ? "#ffffff" : "#333333",
    fontSize: "13px",
    cursor: "pointer",
    fontFamily: "inherit",
  };
}

export async function seedEditor(editor: HTMLKritzelEditorElement) {
  for (const obj of createSeedObjects()) {
    await editor.addObject(obj as KritzelBaseObject<HTMLElement | SVGElement>);
  }
}
