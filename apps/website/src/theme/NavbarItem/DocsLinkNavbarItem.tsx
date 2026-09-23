import React, { useState, useEffect } from 'react';
import Link from '@docusaurus/Link';
import { useLocalPathname } from '@docusaurus/theme-common/internal';
import { getPreferredFramework, frameworkPaths, subscribeToPreferredFramework, setPreferredFramework, getFrameworkFromPath } from '@site/src/utils/frameworkPreference';

interface DocsLinkNavbarItemProps {
  label: string;
  to: string;
  position?: 'left' | 'right';
  className?: string;
  mobile?: boolean;
}

export default function DocsLinkNavbarItem({
  label,
  className,
  mobile,
}: DocsLinkNavbarItemProps): React.ReactNode {
  const localPathname = useLocalPathname();
  const isOnDocsPage = localPathname.includes('/docs');
  const [targetPath, setTargetPath] = useState(() => frameworkPaths[getPreferredFramework()]);

  useEffect(() => {
    // If we are navigating to a docs page via direct URL, persist the framework preference
    const frameworkFromUrl = getFrameworkFromPath(localPathname);
    if (frameworkFromUrl && frameworkFromUrl !== getPreferredFramework()) {
      setPreferredFramework(frameworkFromUrl);
    }

    // Sync on mount and whenever the route changes
    const preferred = getPreferredFramework();
    setTargetPath(frameworkPaths[preferred]);
    // Subscribe to in-tab and cross-tab preference changes
    return subscribeToPreferredFramework((framework) => {
      setTargetPath(frameworkPaths[framework]);
    });
  }, [localPathname]);

  // Hide this link when already on a docs page
  if (isOnDocsPage) {
    return null;
  }

  if (mobile) {
    return (
      <li className="menu__list-item">
        <Link
          to={targetPath}
          className={`menu__link ${className || ''}`}
        >
          {label}
        </Link>
      </li>
    );
  }

  return (
    <Link
      to={targetPath}
      className={`navbar__item navbar__link ${className || ''}`}
    >
      {label}
    </Link>
  );
}
