import React, { useEffect, type ReactNode } from 'react';
import { useLocation } from '@docusaurus/router';
import {
  getFrameworkFromPath,
  getPreferredFramework,
  setPreferredFramework,
} from '@site/src/utils/frameworkPreference';

/**
 * Root wrapper component. Watches route changes and automatically persists
 * the user's framework preference whenever they visit a framework-specific
 * docs page, regardless of how they got there (dropdown, sidebar, direct URL,
 * in-doc link, etc.). This ensures the "Documentation" link and framework
 * dropdown always reflect the most recently viewed framework.
 */
export default function Root({ children }: { children: ReactNode }): React.ReactNode {
  const { pathname } = useLocation();

  useEffect(() => {
    console.log("Root component mounted! pathname:", pathname);
    const framework = getFrameworkFromPath(pathname);
    if (framework && framework !== getPreferredFramework()) {
      setPreferredFramework(framework);
    }
  }, [pathname]);

  return <>{children}</>;
}
