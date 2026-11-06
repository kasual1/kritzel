/**
 * Yjs transaction origin for changes made by one agent.
 *
 * Every agent gets its own instance per object map. Its UndoManager tracks
 * exactly this instance, so agent changes never land in the user's undo stack or in
 * another agent's history. While recording, the origin remembers which object keys the
 * running action changed and which objects were only updated locally (not yet written
 * to Yjs), so the action can emit precise events and persist pending changes on commit.
 * @internal
 */
export class KritzelAgentOrigin {
  /** Object ID -> whether the object existed before the first change of the running action. */
  private _recording: Map<string, boolean> | null = null;
  /** Objects changed in local-only mode during the running action. */
  private readonly _localOnly = new Set<string>();

  constructor(readonly agentId: string) {}

  /** Starts recording changes for a new action. */
  startRecording(): void {
    this._recording = new Map();
    this._localOnly.clear();
  }

  /** Records the keys of a Yjs map event. The first change per key decides whether it existed before. */
  recordKeyChanges(changes: Map<string, { action: 'add' | 'update' | 'delete' }>): void {
    const recording = this._recording;
    if (!recording) {
      return;
    }
    changes.forEach((change, key) => {
      if (!recording.has(key)) {
        recording.set(key, change.action !== 'add');
      }
    });
  }

  /** Remembers an object that was updated without being written to Yjs. */
  markLocalOnly(id: string): void {
    if (this._recording) {
      this._localOnly.add(id);
    }
  }

  /** Forgets pending local-only changes of objects someone else has just written. */
  forgetLocalOnly(ids: Iterable<string>): void {
    for (const id of ids) {
      this._localOnly.delete(id);
    }
  }

  /** Returns and forgets the objects updated in local-only mode. */
  takeLocalOnly(): string[] {
    const ids = Array.from(this._localOnly);
    this._localOnly.clear();
    return ids;
  }

  /** Stops recording and returns the recorded keys. */
  takeRecording(): Map<string, boolean> {
    const recording = this._recording ?? new Map<string, boolean>();
    this._recording = null;
    this._localOnly.clear();
    return recording;
  }

  /** Whether an action is currently recording. */
  get isRecording(): boolean {
    return this._recording !== null;
  }
}
