const CACHE_PREFIX = "kritzel-react-hero";
const CACHE_NAME = `${CACHE_PREFIX}-v2`;
const HERO_ASSET_PATHS = [
  "hero_workspace.json",
  "hero_workspace_mobile.json",
  "image_stack_1.png",
  "image_stack_2.png",
  "image_stack_3.png",
  "image_stack_4.png",
  "lift_off.gif",
  "orion_capsule.glb",
  "rocket.png",
  "rocket_shadow.png",
];

function getScopedUrl(path) {
  return new URL(path, self.registration.scope).href;
}

async function cacheResponse(request, response) {
  if (response.ok && response.status !== 206) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }

  return response;
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  return cacheResponse(request, await fetch(request));
}

async function staleWhileRevalidate(event) {
  const { request } = event;
  const cachedResponse = await caches.match(request);
  const networkResponse = fetch(request)
    .then((response) => cacheResponse(request, response))
    .catch(() => undefined);

  if (cachedResponse) {
    event.waitUntil(networkResponse);
    return cachedResponse;
  }

  return (await networkResponse) ?? Response.error();
}

async function networkFirst(request) {
  try {
    return await cacheResponse(request, await fetch(request));
  } catch {
    return (await caches.match(request)) ?? Response.error();
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(HERO_ASSET_PATHS.map((path) => cache.add(getScopedUrl(path)))),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      ),
      self.clients.claim(),
    ]),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const requestUrl = new URL(request.url);

  if (
    request.method !== "GET" ||
    requestUrl.origin !== self.location.origin ||
    !requestUrl.href.startsWith(self.registration.scope) ||
    request.headers.has("range")
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (requestUrl.pathname.includes("/assets/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (/\.(?:css|gif|glb|jpe?g|json|png|svg|webp|woff2?)$/i.test(requestUrl.pathname)) {
    event.respondWith(staleWhileRevalidate(event));
  }
});