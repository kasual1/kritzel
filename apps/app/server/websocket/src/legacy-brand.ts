/**
 * Document-name prefixes of earlier brands, Updraw and Kritzel. The api migrations renamed these documents to
 * `upmade-…`.
 */
export const LEGACY_DOCUMENT_NAME_PREFIXES = ["updraw-", "kritzel-"] as const;
const DOCUMENT_NAME_PREFIX = "upmade-";

/**
 * Rejects a document requested under a pre-rebrand name, e.g. by a stale cached client bundle,
 * so it doesn't come back as a new, empty row next to the migrated document.
 */
export function assertCurrentDocumentName(documentName: string): void {
  const legacyPrefix = LEGACY_DOCUMENT_NAME_PREFIXES.find((prefix) => documentName.startsWith(prefix));
  if (legacyPrefix) {
    throw new Error(
      `Document "${documentName}" was renamed to "${DOCUMENT_NAME_PREFIX}${documentName.slice(legacyPrefix.length)}"; reload the app to get the current client.`,
    );
  }
}
