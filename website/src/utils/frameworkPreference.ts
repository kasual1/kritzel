const STORAGE_KEY = 'kritzel-preferred-framework';

export type Framework = 'angular' | 'react' | 'vue';

export const frameworkPaths: Record<Framework, string> = {
  angular: '/docs/angular/overview',
  react: '/docs/react/overview',
  vue: '/docs/vue/overview',
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
}

export function getFrameworkFromPath(path: string): Framework | null {
  if (path.includes('/docs/angular')) return 'angular';
  if (path.includes('/docs/react')) return 'react';
  if (path.includes('/docs/vue')) return 'vue';
  return null;
}
