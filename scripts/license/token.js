/**
 * Shared license-token helpers for the Node signing/verification scripts.
 *
 * Token format (single URL-safe line):
 *
 *   KRTZL1.<base64url(payload JSON)>.<base64url(ed25519 signature)>
 *
 * The signature is computed over the UTF-8 bytes of the base64url *payload
 * segment* (the middle part), so signing and verification operate on exactly
 * the same bytes with no JSON canonicalization ambiguity. The browser-side
 * verifier (KritzelLicenseManager) mirrors this logic.
 */

const crypto = require('crypto');

/** Current token format version prefix. Bump when the scheme changes. */
const TOKEN_PREFIX = 'KRTZL1.';

/** Reconstructs an Ed25519 public KeyObject from a raw 32-byte base64url key. */
function publicKeyFromBase64Url(rawB64) {
  const raw = Buffer.from(rawB64, 'base64url');
  if (raw.length !== 32) {
    throw new Error(`Expected a 32-byte Ed25519 public key, got ${raw.length} bytes`);
  }
  // Wrap the raw key in the fixed SPKI DER prefix so crypto can import it.
  const SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');
  const der = Buffer.concat([SPKI_PREFIX, raw]);
  return crypto.createPublicKey({ key: der, format: 'der', type: 'spki' });
}

/**
 * Signs a claims payload with the given Ed25519 private KeyObject and returns
 * the encoded token string.
 */
function signToken(payload, privateKey) {
  const payloadSegment = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const signature = crypto.sign(null, Buffer.from(payloadSegment, 'utf-8'), privateKey);
  return TOKEN_PREFIX + payloadSegment + '.' + signature.toString('base64url');
}

/**
 * Parses a token into its segments without verifying the signature.
 * Returns { payloadSegment, payload, signatureSegment } or throws on malformed input.
 */
function decodeToken(token) {
  if (typeof token !== 'string' || !token.startsWith(TOKEN_PREFIX)) {
    throw new Error('Token is missing the expected KRTZL1. prefix');
  }
  const body = token.slice(TOKEN_PREFIX.length);
  const parts = body.split('.');
  if (parts.length !== 2) {
    throw new Error('Token must have exactly two segments after the prefix');
  }
  const [payloadSegment, signatureSegment] = parts;
  const payload = JSON.parse(Buffer.from(payloadSegment, 'base64url').toString('utf-8'));
  return { payloadSegment, payload, signatureSegment };
}

/**
 * Verifies a token against a raw base64url public key. Returns the decoded
 * payload on success or throws with a reason on failure.
 */
function verifyToken(token, publicKeyB64) {
  const { payloadSegment, payload, signatureSegment } = decodeToken(token);
  const publicKey = publicKeyFromBase64Url(publicKeyB64);
  const ok = crypto.verify(
    null,
    Buffer.from(payloadSegment, 'utf-8'),
    publicKey,
    Buffer.from(signatureSegment, 'base64url'),
  );
  if (!ok) {
    throw new Error('Signature is invalid (token was tampered with or signed by a different key)');
  }
  return payload;
}

module.exports = { TOKEN_PREFIX, signToken, decodeToken, verifyToken, publicKeyFromBase64Url };
