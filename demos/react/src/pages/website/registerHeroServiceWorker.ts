let registrationPromise: Promise<ServiceWorkerRegistration | undefined> | undefined;

function registerWhenIdle(): void {
  if (registrationPromise) {
    return;
  }

  const baseUrl = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;

  const register = () => {
    registrationPromise ??= navigator.serviceWorker
      .register(`${baseUrl}hero-service-worker.js`, {
        scope: baseUrl,
        updateViaCache: "none",
      })
      .catch((error: unknown) => {
        console.warn("Unable to register the hero asset cache.", error);
        return undefined;
      });
  };

  const scheduleRegistration = () => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(register, { timeout: 2000 });
      return;
    }

    setTimeout(register, 0);
  };

  if (document.readyState === "complete") {
    scheduleRegistration();
    return;
  }

  window.addEventListener("load", scheduleRegistration, { once: true });
}

export function registerHeroServiceWorker(): void {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
    return;
  }

  registerWhenIdle();
}