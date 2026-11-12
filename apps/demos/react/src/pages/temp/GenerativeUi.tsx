// TEMP: the minimal agentic canvas of the agentic-canvas blog post ("Building one with Kritzel"), to check that the
// guide's setup is enough on its own; delete with pages/temp/. `/api/chat` is answered by `mock-chat-server.ts`.
import { useState } from "react";
import { createHttpTransport, KritzelChatSession, KritzelEditor } from "@kritzel/react-editor";

export function GenerativeUi() {
  const [session] = useState(
    () =>
      new KritzelChatSession({
        transport: createHttpTransport("/api/chat"),
      }),
  );

  return (
    <KritzelEditor
      chatSession={session}
      isChatBoxVisible={true}
      style={{ display: "block", width: "100%", height: "100vh" }}
    />
  );
}
