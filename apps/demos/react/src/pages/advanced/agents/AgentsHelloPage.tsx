import { useMemo, useRef, useState } from "react";
import { KritzelAgent, KritzelEditor, KritzelWorkspace, type HTMLKritzelEditorElement } from "@kritzel/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { Toolbar } from "../../../components/Toolbar";

/** Where the notes go: the middle first, then around it. */
const SPOTS = [[-120, -110], [160, -110], [-400, -110], [-120, 40], [160, 40], [-400, 40]];

/** Level 1: one agent, one action. */
export function AgentsHelloPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [agent] = useState(() => new KritzelAgent({ name: "Helper", color: "#7C3AED" }));
  const [notes, setNotes] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const workspaces = useMemo(() => [new KritzelWorkspace({ name: "Hello Agent" })], []);

  async function sayHello() {
    const editor = editorRef.current;
    if (!editor) return;
    setIsBusy(true);

    // The cursor appears in the middle of the view. Adding the agent again does nothing.
    await editor.addAgent(agent);
    agent.setStatus("Writing a note");
    // The cursor drags out the note and types its text. Each new note gets a spot of its own.
    const [x, y] = SPOTS[notes % SPOTS.length];
    await agent.createShape({
      x,
      y,
      width: 240,
      height: 110,
      text: notes === 0 ? "Hello from an agent!" : `Hello again (${notes + 1})`,
      style: { fillColor: "#fff3c4", strokeColor: "#e0a800", strokeWidth: 2, fontSize: 20 },
    });
    agent.setStatus("Done");
    setNotes(notes + 1);
    setIsBusy(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "sans-serif" }}>
      <Toolbar>
        <span className="label">Hello Agent</span>
        <button disabled={isBusy} onClick={() => void sayHello()}>Say hello</button>
      </Toolbar>
      <KritzelEditor
        ref={editorRef}
        editorId="agents-hello"
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
