---

sidebar_label: License Activation
displayed_sidebar: tutorialSidebar
title: "License Activation | Kritzel for Angular"
description: "Activate Kritzel with a license key for production use in your Angular application."
---

# License Activation

Kritzel is a commercial library. To use it in production, you need a valid license key.

## Getting a License

License keys are available [here](/get-license). Contact us and we will provide you with a license key for your project.

## Activating Your License

Pass your license key to the `<kritzel-editor>` or `<kritzel-engine>` component via the `licenseKey` prop:

```tsx
import { KritzelEditor } from '@kritzel/react-editor';

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
