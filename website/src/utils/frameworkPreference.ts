const STORAGE_KEY = 'kritzel-preferred-framework';
const CHANGE_EVENT = 'kritzel-framework-preference-change';

export type Framework = 'angular' | 'react' | 'vue';

export const frameworkPaths: Record<Framework, string> = {
  angular: '/docs/angular/getting-started/quick-start',
  react: '/docs/react/getting-started/quick-start',
  vue: '/docs/vue/getting-started/quick-start',
};

export function getPreferredFramework(): Framework {
  if (typeof window === 'undefined') {
    return 'react'; // Default for SSR
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && (stored === 'angular' || stored === 'react' || stored === 'vue')) {
    return stored as Framework;
  }
  return 'react'; // Default framework
}

export function setPreferredFramework(framework: Framework): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(STORAGE_KEY, framework);
  // Notify listeners in the same tab (storage events don't fire in the same tab)
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: framework }));
}

export function subscribeToPreferredFramework(callback: (framework: Framework) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  const customHandler = () => callback(getPreferredFramework());
  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      callback(getPreferredFramework());
    }
  };
  window.addEventListener(CHANGE_EVENT, customHandler);
  window.addEventListener('storage', storageHandler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, customHandler);
    window.removeEventListener('storage', storageHandler);
  };
}

export function getFrameworkFromPath(path: string): Framework | null {
  if (path.includes('/docs/angular')) return 'angular';
  if (path.includes('/docs/react')) return 'react';
  if (path.includes('/docs/vue')) return 'vue';
  return null;
}
