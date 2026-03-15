import React, { useState, useEffect } from 'react';
import Link from '@docusaurus/Link';
import { useLocalPathname } from '@docusaurus/theme-common/internal';
import { getPreferredFramework, frameworkPaths } from '@site/src/utils/frameworkPreference';

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
  const [targetPath, setTargetPath] = useState('/docs/react/overview');

  useEffect(() => {
    const preferred = getPreferredFramework();
    setTargetPath(frameworkPaths[preferred]);
  }, []);

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
