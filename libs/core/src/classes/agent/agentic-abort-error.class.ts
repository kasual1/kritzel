/** Thrown inside an action once it has settled (aborted or interrupted); executors let it propagate. */
export class KritzelAgenticAbortError extends Error {
  constructor() {
    super('Agentic action was stopped.');
    this.name = 'KritzelAgenticAbortError';
  }
}
