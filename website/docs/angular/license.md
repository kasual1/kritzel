---

sidebar_label: License
displayed_sidebar: tutorialSidebar
title: "License Activation | Kritzel for Angular"
description: "Activate Kritzel with a license key for production use in your Angular application."
---

# License Activation

Kritzel is a commercial library. To use it in production, you need a valid license key.

## Getting a License

License keys are available at [kritzel.dev/pricing](https://kritzel.dev/pricing). After purchase, your license key will be sent to the email address used at checkout.

## Activating Your License

Pass your license key to the `<kritzel-editor>` or `<kritzel-engine>` component via the `licenseKey` prop:

```tsx
import { KritzelEditor } from 'kritzel-react';

function App() {
  return (
    <KritzelEditor
      licenseKey="YOUR_LICENSE_KEY"
      style={{ width: '100%', height: '100vh' }}
    />
  );
}
```

The license key is validated at runtime. If the key is missing or invalid, the canvas will render with a watermark.

## License Scope

| Tier | Usage |
|------|-------|
| **Developer** | Single developer, unlimited projects |
| **Team** | Up to 10 developers |
| **Enterprise** | Unlimited developers, priority support |

## FAQ

**Does the license key get exposed to end users?**
The license key is embedded in your frontend bundle. We recommend using an environment variable to keep it out of version control:

```tsx
licenseKey={process.env.NEXT_PUBLIC_KRITZEL_LICENSE}
```

**What happens if my license expires?**
The canvas continues to function but displays a watermark until a valid license is provided.

**Can I use Kritzel for open-source projects?**
Kritzel is free for non-commercial open-source projects. Contact us at [hello@kritzel.dev](mailto:hello@kritzel.dev) to request a free license.
