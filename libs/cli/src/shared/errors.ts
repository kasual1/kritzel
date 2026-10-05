export class CliError extends Error {}
export class CancelledError extends CliError {}

export function hasCode(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}
