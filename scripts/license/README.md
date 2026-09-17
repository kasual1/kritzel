# License Workflow

This folder contains the local tooling to issue and validate Kritzel license keys.

## Files

- `generate-keypair.js`: Generates the Ed25519 signing keypair.
- `sign-license.js`: Creates signed customer license tokens.
- `verify-license.js`: Verifies tokens locally against the public key.
- `token.js`: Shared token encode/sign/verify helpers.
- `keys/public.b64`: Public verification key (safe to share).
- `keys/private.pem`: Private signing key (must stay secret, gitignored).

## One-Time Setup

1. Generate a signing keypair:
   ```bash
   npm run license:keygen
   ```
2. Keep `scripts/license/keys/private.pem` secure and backed up.
3. Ensure the generated public key is the one embedded in `KRITZEL_LICENSE_PUBLIC_KEY` at `libs/engine/core/src/constants/license.constants.ts`.

## Issue a License

Use `license:sign` with a customer, plan, and allowed domains.

```bash
npm run license:sign -- --sub "Acme Corp" --plan basic --allowed-domains "app.acme.com"
```

Supported plans and max domains:

- `basic`: up to 3 domains
- `pro`: up to 5 domains
- `enterprise`: up to 15 domains

Expiry options:

- `--years <n>` (default is 1 year)
- `--expires YYYY-MM-DD`
- `--no-expiry` for perpetual licenses

Example:

```bash
npm run license:sign -- --sub "Acme Corp" --plan pro --allowed-domain app.acme.com --allowed-domain admin.acme.com --years 2
```

## Verify Before Sending

```bash
npm run license:verify -- "<TOKEN>" app.acme.com
```

This checks signature validity, expiry status, and optional hostname match.

## Runtime Notes

- License keys are passed via the `licenseKey` prop on Kritzel components.
- Tokens must include `allowedDomains`; hostname must match exactly after normalization.
- Missing/invalid/expired/mismatched tokens keep the watermark visible.
