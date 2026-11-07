import { useEffect, useMemo, useRef, useState } from "react";
import {
  KritzelAgent,
  KritzelAgentActionError,
  KritzelEditor,
  KritzelWorkspace,
  type HTMLKritzelEditorElement,
} from "@kritzel/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { Toolbar } from "../../../components/Toolbar";
import { flower, house, type Drawing } from "./sketch/drawings";

/** Drawing speed in screen pixels per second: slow enough to watch the pen. */
const PEN_SPEED = 520;

/** Level 3: a multi-step task that can be stopped, and an undo history of the agent's own. */
export function AgentsSketchPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [artist] = useState(() => new KritzelAgent({ name: "Artist", color: "#DB2777", position: { x: 0, y: 260 } }));
  const [canUndo, setCanUndo] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [message, setMessage] = useState("Pick something to draw.");
  const workspaces = useMemo(() => [new KritzelWorkspace({ name: "Sketch Artist" })], []);

  // Mirror the agent's history into React state, for the Undo button.
  useEffect(() => artist.on("change", state => setCanUndo(state.canUndo)), [artist]);

  async function draw(drawing: Drawing) {
    const editor = editorRef.current;
    if (!editor || isDrawing) return;
    await editor.addAgent(artist);
    setIsDrawing(true);
    setMessage(`Drawing ${drawing.name}…`);
    let done = 0;
    try {
      // A task shows its label as the status, and the first stroke that does not complete throws out of it.
      await artist.task(`Drawing ${drawing.name}`, async () => {
        for (const stroke of drawing.strokes) {
          artist.setStatus(`Drawing the ${stroke.label}`);
          await artist.drawPath(stroke.points, { style: { strokeColor: stroke.color, strokeWidth: stroke.width ?? 5 }, speed: PEN_SPEED });
          done++;
        }
      });
      setMessage(`Finished ${drawing.name} in ${done} strokes. Each stroke is one step in the artist's history.`);
    } catch (error) {
      if (!(error instanceof KritzelAgentActionError)) throw error;
      // cancel() rolled back the stroke in progress; the finished ones stay.
      setMessage(`Stopped after ${done} of ${drawing.strokes.length} strokes (${error.reason}).`);
    } finally {
      setIsDrawing(false);
    }
  }

  async function undo() {
    const result = await artist.undo();
    setMessage(result.completed ? "Took back the last stroke." : `Nothing to undo (${result.reason}).`);
  }

  async function erase() {
    const editor = editorRef.current;
    if (!editor || isDrawing) return;
    const strokes = await editor.findObjects(object => object.__class__ === "KritzelPath");
    if (strokes.length === 0) return;
    await editor.addAgent(artist);
    artist.setStatus("Erasing");
    await artist.deleteObjects(strokes.map(stroke => stroke.id));
    artist.setStatus(null);
    setMessage("Erased everything. Undo brings it back.");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "sans-serif" }}>
      <Toolbar>
        <span className="label">Sketch Artist</span>
        <button disabled={isDrawing} onClick={() => void draw(house([-210, 10]))}>Draw a house</button>
        <button disabled={isDrawing} onClick={() => void draw(flower([330, 20]))}>Draw a flower</button>
        <button disabled={!isDrawing} onClick={() => artist.cancel()}>Stop</button>
        <button disabled={isDrawing || !canUndo} onClick={() => void undo()}>Undo stroke</button>
        <button disabled={isDrawing} onClick={() => void erase()}>Erase all</button>
        <span className="label" data-testid="sketch-message" data-drawing={isDrawing}>{message}</span>
      </Toolbar>
      <KritzelEditor
        ref={editorRef}
        editorId="agents-sketch"
        theme="light"
        themes={[reactThemeLight, reactThemeDark]}
        workspaces={workspaces}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        style={{ flex: 1, minHeight: 0 }}
      />
    </div>
  );
}
