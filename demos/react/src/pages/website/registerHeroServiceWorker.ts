let registrationPromise: Promise<ServiceWorkerRegistration | undefined> | undefined;

export function registerHeroServiceWorker(): void {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
    return;
  }

  const baseUrl = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;

  registrationPromise ??= navigator.serviceWorker
    .register(`${baseUrl}hero-service-worker.js`, {
      scope: baseUrl,
      updateViaCache: "none",
    })
    .catch((error: unknown) => {
      console.warn("Unable to register the hero asset cache.", error);
      return undefined;
    });
}