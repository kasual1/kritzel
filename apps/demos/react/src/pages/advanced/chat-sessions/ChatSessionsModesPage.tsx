import { useEffect, useMemo, useState } from "react";
import {
  KritzelAgent,
  KritzelChatSession,
  KritzelEditor,
  KritzelWorkspace,
  type KritzelBaseObject,
  type KritzelChatBoxChip,
  type KritzelChatMessage,
} from "@kritzel/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";
import { reactThemeDark } from "../../../const/react-theme-dark";
import { createSeedObjects } from "../../getting-started/seed-objects";
import { Toolbar } from "../../../components/Toolbar";
import { createDemoTransport, SLOW_PHRASE } from "./chat-session-script";

type Mode = "user" | "agent";

const USER = { id: "demo-user", name: "Demo User" };
const SYSTEM = "You draw on a whiteboard. Keep answers short.";

/** One line of the transcript: who wrote it and what. */
function describe(message: KritzelChatMessage): string {
  return message.parts
    .map(part => {
      if (part.type === "text") return part.text;
      if (part.type === "tool-call") return `→ ${part.name}`;
      if (part.type === "tool-result") return `← ${part.name}${part.isError ? " (failed)" : ""}`;
      return `[${part.type}]`;
    })
    .join(" ");
}

export function ChatSessionsModesPage() {
  const workspaces = useMemo(() => [new KritzelWorkspace({ objects: createSeedObjects() })], []);
  // One session per mode, created once: switching the mode binds the other one.
  const sessions = useMemo(() => {
    const transport = createDemoTransport();
    const agent = new KritzelAgent({ id: "assistant", name: "Assistant", color: "#7C3AED" });
    return {
      user: new KritzelChatSession({ transport, system: SYSTEM }),
      agent: new KritzelChatSession({ transport, system: SYSTEM, agent }),
    };
  }, []);
  const [mode, setMode] = useState<Mode>("user");
  const [chips, setChips] = useState<KritzelChatBoxChip[]>([]);
  const [messages, setMessages] = useState<readonly KritzelChatMessage[]>([]);
  const session = sessions[mode];

  useEffect(() => {
    setMessages(session.messages);
    return session.on("change", () => setMessages(session.messages));
  }, [session]);

  function handleSelection(objects: KritzelBaseObject[]) {
    setChips(
      objects.map(object => ({
        id: object.id,
        objectId: object.id,
        label: object.name || object.__class__.replace("Kritzel", ""),
        icon: "cursor",
      })),
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "sans-serif" }}>
      <Toolbar>
        <span className="label">Chat Sessions</span>
        <button aria-pressed={mode === "user"} disabled={mode === "user"} onClick={() => setMode("user")}>
          Work as User
        </button>
        <button aria-pressed={mode === "agent"} disabled={mode === "agent"} onClick={() => setMode("agent")}>
          Work as Agent
        </button>
        <span className="label">Try “{SLOW_PHRASE}” to stop a response.</span>
      </Toolbar>
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <KritzelEditor
          editorId="chat-sessions-modes"
          theme="light"
          themes={[reactThemeLight, reactThemeDark]}
          workspaces={workspaces}
          user={USER}
          isChatBoxVisible={true}
          chatSession={session}
          chatBoxChips={chips}
          isMoreMenuVisible={false}
          isWorkspaceManagerVisible={false}
          onObjectsSelectionChange={event => handleSelection(event.detail)}
          onChatChipRemove={event => setChips(current => current.filter(chip => chip.id !== event.detail.id))}
          style={{ flex: 1, minWidth: 0 }}
        />
        <ol className="chat-transcript" aria-label="Transcript" style={{ width: 260, margin: 0, padding: "8px 8px 8px 28px", overflow: "auto", fontSize: 13, borderLeft: "1px solid #e5e7eb" }}>
          {messages.map((message, index) => (
            <li key={index} data-role={message.role}>
              <strong>{message.role}:</strong> {describe(message)}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
