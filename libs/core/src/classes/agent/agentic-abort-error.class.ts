/** Thrown inside an action once it has settled (aborted or interrupted); executors let it propagate. */
export class UpmadeAgenticAbortError extends Error {
  constructor() {
    super('Agentic action was stopped.');
    this.name = 'UpmadeAgenticAbortError';
  }
}
