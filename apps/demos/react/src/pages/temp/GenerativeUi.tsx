// TEMP: the minimal agentic canvas of the agentic-canvas blog post ("Building one with Upmade"), to check that the
// guide's setup is enough on its own; delete with pages/temp/. `/api/chat` is answered by `mock-chat-server.ts`.
import { useState } from "react";
import { createHttpTransport, UpmadeChatSession, UpmadeEditor } from "@upmade/react-editor";

export function GenerativeUi() {
  const [session] = useState(
    () =>
      new UpmadeChatSession({
        transport: createHttpTransport("/api/chat"),
      }),
  );

  return (
    <UpmadeEditor
      chatSession={session}
      isChatBoxVisible={true}
      style={{ display: "block", width: "100%", height: "100vh" }}
    />
  );
}
