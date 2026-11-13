/** Document-name prefix from before the rebrand. The api migration renamed these documents to `updraw-…`. */
export const LEGACY_DOCUMENT_NAME_PREFIX = "kritzel-";

/**
 * Rejects a document requested under its pre-rebrand name, e.g. by a stale cached client bundle,
 * so it doesn't come back as a new, empty row next to the migrated document.
 */
export function assertCurrentDocumentName(documentName: string): void {
  if (documentName.startsWith(LEGACY_DOCUMENT_NAME_PREFIX)) {
    throw new Error(
      `Document "${documentName}" was renamed to "updraw-${documentName.slice(LEGACY_DOCUMENT_NAME_PREFIX.length)}"; reload the app to get the current client.`,
    );
  }
}
