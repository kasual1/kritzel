// TEMP: mock of a chat backend for the temp chat-modes demo; delete with pages/temp/.
import type { KritzelChatRequest, KritzelChatResponse, KritzelChatToolCallPart, KritzelChatTransport } from '@kritzel/angular-editor';

type Step = { text?: string; calls?: { name: string; input: object }[] };

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => (clearTimeout(timer), reject(new DOMException('Aborted', 'AbortError'))));
  });

/** Stands in for `fetch('/api/chat')`: answers after a model-like delay. */
export const mockTransport: KritzelChatTransport = async (request, { signal }) => {
  await wait(600 + Math.random() * 600, signal);
  return toResponse(answer(request));
};

/** Plays the model: one step per request, decided by the prompt and the tool results so far. */
function answer(request: KritzelChatRequest): Step {
  const lastUser = request.messages.map(m => m.role).lastIndexOf('user');
  const prompt = request.messages[lastUser].parts.map(p => (p.type === 'text' ? p.text : '')).join('\n');
  const turn = request.messages.slice(lastUser + 1);
  const step = turn.filter(m => m.role === 'assistant').length;
  const results = turn.flatMap(m => m.parts).flatMap(p => (p.type === 'tool-result' ? [JSON.parse(p.output)] : []));
  const selected = [...prompt.matchAll(/objectId: ([\w-]+)/g)].map(m => m[1]);
  const text = prompt.split('\n')[0].toLowerCase();

  // Prompts about the selection (chips).
  if (selected.length > 0) {
    if (step > 0) return { text: 'Done.' };
    if (text.includes('delete') || text.includes('remove')) {
      return { text: 'Removing it.', calls: [{ name: 'delete_objects', input: { objectIds: selected } }] };
    }
    const color = ['red', 'green', 'blue', 'yellow', 'purple'].find(c => text.includes(c)) ?? 'orange';
    return { text: `Making it ${color}.`, calls: [{ name: 'set_style', input: { objectIds: selected, style: { fillColor: color } } }] };
  }

  // Everything else: look at the board, then build below what is there.
  if (step === 0) return { text: 'Let me look at the board first.', calls: [{ name: 'observe_canvas', input: {} }] };
  const top = step === 1 ? freeY(results[0]) : 0;

  if (text.includes('flow')) {
    if (step === 1) {
      const labels = ['Idea', 'Build', 'Ship'];
      return {
        text: 'Drawing the three stages.',
        calls: labels.map((label, i) => ({ name: 'create_shape', input: { x: i * 220, y: top, width: 160, height: 70, text: label } })),
      };
    }
    if (step === 2) {
      const [a, b, c] = results.slice(1).map(r => r.objectIds[0]);
      return { text: 'Connecting them.', calls: [{ name: 'connect', input: { from: a, to: b } }, { name: 'connect', input: { from: b, to: c } }] };
    }
    return { text: 'Here is your flowchart: Idea → Build → Ship.' };
  }

  if (step === 1) {
    return { text: 'Adding a sticky note.', calls: [{ name: 'create_shape', input: { x: 0, y: top, width: 200, height: 100, text: prompt.split('\n')[0], style: { fillColor: '#fef3c7' } } }] };
  }
  return { text: 'Added a note with your text.' };
}

/** The y below the lowest object of an observe_canvas snapshot. */
function freeY(snapshot: { objects?: { y: number; height: number }[] }): number {
  const bottoms = (snapshot.objects ?? []).map(o => o.y + o.height);
  return bottoms.length > 0 ? Math.max(...bottoms) + 60 : 0;
}

let callId = 0;

function toResponse(step: Step): KritzelChatResponse {
  const calls: KritzelChatToolCallPart[] = (step.calls ?? []).map(c => ({ type: 'tool-call', id: `call_${++callId}`, name: c.name, input: c.input }));
  return {
    version: 1,
    message: { role: 'assistant', parts: [...(step.text ? [{ type: 'text' as const, text: step.text }] : []), ...calls] },
    stopReason: calls.length > 0 ? 'tool-calls' : 'end',
  };
}
