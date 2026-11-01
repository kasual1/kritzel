import { useState } from "react";
import { MOCK_UIS, type MockUi } from "./mock-uis";

export interface MockChatBoxProps {
  isWorking: boolean;
  onSend: (ui: MockUi) => void;
}

/** Stands in for the editor's chat box while requests are mocked: the prompts are prefilled and cannot be edited. */
export function MockChatBox({ isWorking, onSend }: MockChatBoxProps) {
  const [index, setIndex] = useState(0);

  function send() {
    onSend(MOCK_UIS[index]);
    setIndex(Math.min(index + 1, MOCK_UIS.length - 1));
  }

  return (
    <div className="mock-chat">
      <textarea className="mock-chat__prompt" rows={3} readOnly aria-label="Mocked prompt" value={MOCK_UIS[index].prompt} />
      <div className="mock-chat__controls">
        <button type="button" className="mock-chat__nav" aria-label="Previous prompt" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          ‹
        </button>
        <span>{`${index + 1} of ${MOCK_UIS.length}`}</span>
        <button type="button" className="mock-chat__nav" aria-label="Next prompt" disabled={index === MOCK_UIS.length - 1} onClick={() => setIndex(index + 1)}>
          ›
        </button>
        <button type="button" className="mock-chat__send" disabled={isWorking} onClick={send}>
          Send
        </button>
      </div>
    </div>
  );
}
