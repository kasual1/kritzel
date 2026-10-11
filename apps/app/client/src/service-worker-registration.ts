const MAX_RETRY_DELAY_MS = 60_000;

export function registerServiceWorkerWithRetry(): void {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  let retryDelayMs = 1_000;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let registration: ServiceWorkerRegistration | undefined;

  const scheduleRetry = () => {
    if (retryTimer !== undefined) {
      return;
    }

    retryTimer = setTimeout(() => {
      retryTimer = undefined;
      void register();
    }, retryDelayMs);
    retryDelayMs = Math.min(retryDelayMs * 2, MAX_RETRY_DELAY_MS);
  };

  const register = async () => {
    try {
      registration = await navigator.serviceWorker.register('/ngsw-worker.js', {
        scope: '/',
        updateViaCache: 'none',
      });
      retryDelayMs = 1_000;
    } catch (error) {
      console.warn('Service worker registration failed; retrying.', error);
      scheduleRetry();
    }
  };

  window.addEventListener('online', () => {
    if (retryTimer !== undefined) {
      clearTimeout(retryTimer);
      retryTimer = undefined;
    }

    if (registration) {
      void registration.update().catch(scheduleRetry);
    } else {
      retryDelayMs = 1_000;
      void register();
    }
  });

  void register();
}