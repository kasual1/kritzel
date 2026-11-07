import { useEffect, useMemo, useRef, useState } from "react";
import {
  KritzelAgent,
  KritzelEditor,
  KritzelWorkspace,
  ShapeType,
  type HTMLKritzelEditorElement,
  type KritzelBaseObject,
} from "@kritzel/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { Toolbar } from "../../../components/Toolbar";
import { NOTE_COLORS, stickyNote } from "./shared/sticky-note";

const SHAPE_NAMES: Record<string, string> = { rectangle: "A rectangle", ellipse: "A circle", triangle: "A triangle" };

/** The text of a shape's ProseMirror document. */
function textOf(object: KritzelBaseObject): string {
  const collect = (node: unknown): string => {
    const { text, content } = (node ?? {}) as { text?: string; content?: unknown[] };
    return (text ?? "") + (content ?? []).map(collect).join(" ");
  };
  return collect((object as { content?: unknown }).content).replace(/\s+/g, " ").trim();
}

/** What the agent says about an object. */
function describe(object: KritzelBaseObject): string {
  switch (object.__class__) {
    case "KritzelShape": {
      const text = textOf(object);
      return text ? `A note: “${text}”` : SHAPE_NAMES[(object as { shapeType?: string }).shapeType ?? ""] ?? "A shape";
    }
    case "KritzelPath":
      return "A drawing";
    case "KritzelText":
      return "Some text";
    case "KritzelLine":
      return "A line";
    default:
      return "Something";
  }
}

function createSeeds() {
  return [
    stickyNote({ x: -330, y: -190, width: 130, height: 130, shapeType: ShapeType.Ellipse, ...NOTE_COLORS.blue }),
    stickyNote({ x: -110, y: -170, width: 170, height: 100, ...NOTE_COLORS.pink }),
    stickyNote({ x: 150, y: -200, width: 150, height: 130, shapeType: ShapeType.Triangle, ...NOTE_COLORS.green }),
    stickyNote({ x: -60, y: 20, width: 200, height: 100, text: "Drag me around", ...NOTE_COLORS.yellow }),
  ];
}

/** Level 2: an agent that reacts to what the user does. */
export function AgentsFollowPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [agent] = useState(() => new KritzelAgent({ name: "Buddy", color: "#0EA5E9", status: "Select something", position: { x: 320, y: 120 } }));
  const workspaces = useMemo(() => [new KritzelWorkspace({ name: "Follow the Selection", objects: createSeeds() })], []);

  // The cursor sticks to the object it moved to. When the object is deleted, the agent is told.
  useEffect(
    () =>
      agent.on("detached", ({ reason }) => {
        if (reason === "object-removed") agent.setStatus("It's gone!");
      }),
    [agent],
  );

  async function onSelectionChange(objects: KritzelBaseObject[]) {
    const selected = objects.filter(object => object.__class__ !== "KritzelSelectionGroup" && object.__class__ !== "KritzelSelectionBox");
    if (selected.length === 0) {
      agent.setStatus("Select something");
      return;
    }
    agent.setStatus(selected.length === 1 ? describe(selected[0]) : `${selected.length} things`);
    // A new selection interrupts the previous move; the cursor continues from where it is.
    await agent.moveTo({ objectId: selected[0].id, anchor: "top-right", offset: { x: 6, y: -6 } }).catch(() => undefined);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "sans-serif" }}>
      <Toolbar>
        <span className="label">Follow the Selection</span>
        <span className="status">Select a shape, drag it, or delete it. The agent follows along.</span>
      </Toolbar>
      <KritzelEditor
        ref={editorRef}
        editorId="agents-follow"
        theme="light"
        themes={[reactThemeLight, reactThemeDark]}
        workspaces={workspaces}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        onIsReady={() => void editorRef.current?.addAgent(agent)}
        onObjectsSelectionChange={event => void onSelectionChange(event.detail)}
        style={{ flex: 1, minHeight: 0 }}
      />
    </div>
  );
}
