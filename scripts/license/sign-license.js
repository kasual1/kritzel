/**
 * Signs a Kritzel license token for a customer.
 *
 * Reads the master private key (scripts/license/keys/private.pem), builds a
 * claims payload, signs it with Ed25519, and prints the token to send to the
 * customer. The customer passes the token to the editor/engine via the
 * `licenseKey` prop to remove the watermark.
 *
 * Only `exp` (expiry) is enforced at runtime. `sub` and `plan` are carried as
 * audit metadata so a leaked token can be traced back to a customer.
 *
 * Usage:
 *   node scripts/license/sign-license.js --sub "Acme Corp" [--plan team] \
 *        [--expires 2027-01-01 | --years 1] [--no-expiry]
 *
 * Examples:
 *   node scripts/license/sign-license.js --sub "Acme Corp" --plan team --years 1
 *   node scripts/license/sign-license.js --sub "Acme Corp" --no-expiry
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { signToken, verifyToken } = require('./token');

const KEYS_DIR = path.join(__dirname, 'keys');
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, 'private.pem');
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, 'public.b64');

/** Minimal `--flag value` / `--bool` parser; no dependencies. */
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    fail(`No private key found at ${PRIVATE_KEY_PATH}.\n   Run "npm run license:keygen" first.`);
  }

  const sub = typeof args.sub === 'string' ? args.sub.trim() : '';
  if (!sub) {
    fail('Missing required --sub "<customer name or id>".');
  }

  const plan = typeof args.plan === 'string' ? args.plan.trim() : 'developer';

  // Resolve expiry: --no-expiry > --expires <date> > --years <n> > default 1 year.
  const nowSeconds = Math.floor(Date.now() / 1000);
  let exp;
  if (args['no-expiry']) {
    exp = undefined;
  } else if (typeof args.expires === 'string') {
    const ms = Date.parse(args.expires);
    if (Number.isNaN(ms)) fail(`Could not parse --expires "${args.expires}". Use e.g. 2027-01-01.`);
    exp = Math.floor(ms / 1000);
  } else {
    const years = typeof args.years === 'string' ? Number(args.years) : 1;
    if (!Number.isFinite(years) || years <= 0) fail(`Invalid --years "${args.years}".`);
    exp = nowSeconds + Math.round(years * 365 * 24 * 60 * 60);
  }

  if (exp !== undefined && exp <= nowSeconds) {
    fail('The requested expiry is in the past; refusing to sign an already-expired license.');
  }

  const payload = { sub, plan, iat: nowSeconds };
  if (exp !== undefined) payload.exp = exp;

  const privateKey = crypto.createPrivateKey(fs.readFileSync(PRIVATE_KEY_PATH, 'utf-8'));
  const token = signToken(payload, privateKey);

  // Self-check: verify against the published public key if available, so we
  // never hand out a token the library would reject.
  if (fs.existsSync(PUBLIC_KEY_PATH)) {
    const publicB64 = fs.readFileSync(PUBLIC_KEY_PATH, 'utf-8').trim();
    try {
      verifyToken(token, publicB64);
    } catch (err) {
      fail(`Internal self-check failed: ${err.message}`);
    }
  }

  console.log('✅ License signed.\n');
  console.log('Claims:');
  console.log(`   sub:  ${payload.sub}`);
  console.log(`   plan: ${payload.plan}`);
  console.log(`   iat:  ${new Date(payload.iat * 1000).toISOString()}`);
  console.log(`   exp:  ${exp === undefined ? '(perpetual)' : new Date(exp * 1000).toISOString()}\n`);
  console.log('Send this license key to the customer:\n');
  console.log(token + '\n');
}

main();
