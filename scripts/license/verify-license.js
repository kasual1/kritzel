/**
 * Verifies a Kritzel license token locally, mirroring what the library does in
 * the browser. Handy for sanity-checking a token you just signed without
 * spinning up the editor.
 *
 * Uses the published public key (scripts/license/keys/public.b64). This proves
 * nothing the private key can do — it only confirms the token is well-formed,
 * correctly signed, and reports whether it is currently expired.
 *
 * Usage: node scripts/license/verify-license.js <token> [hostname-to-check]
 */

const fs = require('fs');
const path = require('path');
const { verifyToken } = require('./token');

const PUBLIC_KEY_PATH = path.join(__dirname, 'keys', 'public.b64');

function normalizeDomain(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  const withoutTrailingDot = trimmed.endsWith('.') ? trimmed.slice(0, -1) : trimmed;
  if (!withoutTrailingDot) {
    return null;
  }

  try {
    const parsed = new URL(`https://${withoutTrailingDot}`);
    if (parsed.hostname !== withoutTrailingDot) {
      return null;
    }
    return parsed.hostname.toLowerCase();
  } catch {
    return null;
  }
}

function normalizeAllowedDomains(value) {
  if (!Array.isArray(value)) {
    return null;
  }

  const normalized = [];
  const seen = new Set();
  for (const item of value) {
    const domain = normalizeDomain(item);
    if (!domain) {
      return null;
    }
    if (!seen.has(domain)) {
      seen.add(domain);
      normalized.push(domain);
    }
  }
  return normalized;
}

function main() {
  const token = process.argv[2];
  const hostnameToCheck = process.argv[3];
  if (!token) {
    console.error('❌ Usage: node scripts/license/verify-license.js <token> [hostname-to-check]');
    process.exit(1);
  }

  if (!fs.existsSync(PUBLIC_KEY_PATH)) {
    console.error(`❌ No public key found at ${PUBLIC_KEY_PATH}. Run "npm run license:keygen" first.`);
    process.exit(1);
  }

  const publicB64 = fs.readFileSync(PUBLIC_KEY_PATH, 'utf-8').trim();

  let payload;
  try {
    payload = verifyToken(token, publicB64);
  } catch (err) {
    console.error(`❌ Invalid token: ${err.message}`);
    process.exit(1);
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const expired = typeof payload.exp === 'number' && payload.exp <= nowSeconds;
  const allowedDomains = normalizeAllowedDomains(payload.allowedDomains);

  console.log('✅ Signature is valid.\n');
  console.log('Claims:');
  console.log(`   sub:  ${payload.sub}`);
  console.log(`   plan: ${payload.plan}`);
  if (allowedDomains === null || allowedDomains.length === 0) {
    console.log('   domains: (missing/invalid for strict domains mode)');
  } else {
    console.log(`   domains (${allowedDomains.length}): ${allowedDomains.join(', ')}`);
  }
  console.log(`   iat:  ${payload.iat ? new Date(payload.iat * 1000).toISOString() : '(none)'}`);
  console.log(`   exp:  ${payload.exp === undefined ? '(perpetual)' : new Date(payload.exp * 1000).toISOString()}\n`);

  if (hostnameToCheck !== undefined) {
    const normalizedHostname = normalizeDomain(hostnameToCheck);
    if (!normalizedHostname) {
      console.error(`❌ Invalid hostname-to-check "${hostnameToCheck}".`);
      process.exit(1);
    }
    const matches = !!allowedDomains && allowedDomains.includes(normalizedHostname);
    console.log(`Hostname check (${normalizedHostname}): ${matches ? 'MATCH' : 'NO MATCH'}\n`);
  }

  if (expired) {
    console.log('⚠️  This token is EXPIRED — the library would show the watermark.');
    process.exit(2);
  }
  console.log('This token is currently valid — the watermark would be removed.');
}

main();
