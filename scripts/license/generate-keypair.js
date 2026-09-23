/**
 * Generates an Ed25519 key pair for signing Kritzel license tokens.
 *
 * Run this ONCE. The private key is the master signing secret for all Kritzel
 * licenses and must be kept secret and backed up safely:
 *   - It is written to scripts/license/keys/private.pem (git-ignored).
 *   - Anyone with this file can mint valid licenses. Never commit or share it.
 *
 * The public key is NOT a secret. It is embedded in the library (see
 * KRITZEL_LICENSE_PUBLIC_KEY in license.constants.ts) and can only *verify*
 * tokens, never create them. Paste the printed value there.
 *
 * Usage: node scripts/license/generate-keypair.js [--force]
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const KEYS_DIR = path.join(__dirname, 'keys');
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, 'private.pem');
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, 'public.b64');

/**
 * Extracts the raw 32-byte Ed25519 public key from a KeyObject and encodes it
 * as base64url. This is the exact format the browser embeds and imports via
 * crypto.subtle.importKey('raw', ...).
 */
function rawPublicKeyBase64Url(publicKey) {
  // SPKI DER for an Ed25519 public key is a fixed 44-byte structure whose last
  // 32 bytes are the raw key. Slicing avoids pulling in an ASN.1 dependency.
  const spki = publicKey.export({ type: 'spki', format: 'der' });
  const raw = spki.subarray(spki.length - 32);
  return raw.toString('base64url');
}

function main() {
  const force = process.argv.includes('--force');

  if (fs.existsSync(PRIVATE_KEY_PATH) && !force) {
    console.error(`❌ A private key already exists at:\n   ${PRIVATE_KEY_PATH}`);
    console.error('   Refusing to overwrite. Re-run with --force only if you are SURE');
    console.error('   you want to invalidate every license signed with the old key.');
    process.exit(1);
  }

  fs.mkdirSync(KEYS_DIR, { recursive: true });

  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');

  const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' });
  fs.writeFileSync(PRIVATE_KEY_PATH, privatePem, { mode: 0o600 });

  const publicB64 = rawPublicKeyBase64Url(publicKey);
  fs.writeFileSync(PUBLIC_KEY_PATH, publicB64 + '\n', 'utf-8');

  console.log('✅ Generated a new Ed25519 license key pair.\n');
  console.log(`   Private key (KEEP SECRET): ${PRIVATE_KEY_PATH}`);
  console.log(`   Public key:                ${PUBLIC_KEY_PATH}\n`);
  console.log('Embed this public key in the library as KRITZEL_LICENSE_PUBLIC_KEY');
  console.log('(libs/engine/core/src/constants/license.constants.ts):\n');
  console.log(`   ${publicB64}\n`);
  console.log('⚠️  Back up the private key. If you lose it you cannot sign new');
  console.log('    licenses; if it leaks, anyone can mint licenses for free.');
}

main();
