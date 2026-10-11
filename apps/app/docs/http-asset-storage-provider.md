# Configure `assetStorage` for an External HTTP Asset Service

Use Kritzel's asset storage provider configuration to store images and other binary assets outside the Yjs document. For an external HTTP service, configure `assetStorage.providers` with `HttpAssetProvider.with(...)`.

```ts
import { HttpAssetProvider, IndexedDBAssetProvider } from '@kritzel/engine';

const assetStorage = {
  providers: [
    IndexedDBAssetProvider,
    HttpAssetProvider.with({
      uploadUrl: () => 'https://api.example.com/assets',
      resolveUrl: (id) => `https://cdn.example.com/assets/${id}`,
      headers: async () => ({
        Authorization: `Bearer ${await getAccessToken()}`,
      }),
      deleteUrl: (id) => `https://api.example.com/assets/${id}`,
    }),
  ],
};
```

Expected HTTP service behavior:

- `uploadUrl` should point to an endpoint that accepts a `POST` request with `multipart/form-data`.
- The request body contains a `file` field with the uploaded blob and a `metadata` field containing JSON metadata such as the asset id, mime type, width, height, and original filename.
- The endpoint may return JSON with an optional `id` and `url`. If no `id` is returned, Kritzel uses the generated metadata id.
- `resolveUrl` must return a stable public or authenticated URL that Kritzel can use directly as the image source.
- `headers` is optional and should be used to attach fresh auth headers for each request.
- `deleteUrl` is optional. If provided, Kritzel sends `DELETE` requests when an asset should be removed.

Keep `IndexedDBAssetProvider` first so the browser can cache assets locally, while the HTTP provider replicates them across devices.