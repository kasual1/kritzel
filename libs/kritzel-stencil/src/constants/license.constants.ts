/**
 * License verification constants.
 *
 * Kritzel licenses are offline Ed25519 signed tokens. The owner signs each
 * customer's token with a private key that never leaves their machine
 * (see scripts/license/); the library verifies tokens against the public key
 * below. The public key is safe to ship — it can only *verify* signatures,
 * never forge them.
 */

/**
 * Token format version prefix. A valid license key looks like:
 *
 *   KRTZL1.<base64url(payload JSON)>.<base64url(ed25519 signature)>
 *
 * Bump the version (and this prefix) if the token scheme ever changes.
 */
export const KRITZEL_LICENSE_TOKEN_PREFIX = 'KRTZL1.';

/**
 * Raw 32-byte Ed25519 public key (base64url) used to verify license tokens.
 *
 * Generate the matching key pair with `npm run license:keygen` and paste the
 * printed public key here. Replacing this value invalidates every license
 * signed with the previous key.
 */
export const KRITZEL_LICENSE_PUBLIC_KEY = '2IwZDin-qV3kOt8SEQCqdaJsGT9S7tAGapUYJVnVGQo';
