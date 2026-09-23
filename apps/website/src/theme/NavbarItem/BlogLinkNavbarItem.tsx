import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';

export interface BlogLinkNavbarItemProps {
  label: string;
  className?: string;
  mobile?: boolean;
}

export default function BlogLinkNavbarItem({
  label,
  className,
  mobile,
}: BlogLinkNavbarItemProps): JSX.Element | null {
  const { pathname } = useLocation();
  const isOnDocsPage = pathname.includes('/docs');

  if (isOnDocsPage) {
    return null;
  }

  if (mobile) {
    return (
      <li className="menu__list-item">
        <Link to="/blog" className={`menu__link ${className || ''}`}>
          {label}
        </Link>
      </li>
    );
  }

  return (
    <Link to="/blog" className={`navbar__item navbar__link ${className || ''}`}>
      {label}
    </Link>
  );
}
