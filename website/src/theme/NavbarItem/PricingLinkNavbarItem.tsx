import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';

export interface PricingLinkNavbarItemProps {
  label: string;
  className?: string;
  mobile?: boolean;
}

export default function PricingLinkNavbarItem({
  label,
  className,
  mobile,
}: PricingLinkNavbarItemProps): JSX.Element | null {
  const { pathname } = useLocation();
  const isOnDocsPage = pathname.includes('/docs');

  // Hide Pricing link when on docs pages
  if (isOnDocsPage) {
    return null;
  }

  if (mobile) {
    return (
      <li className="menu__list-item">
        <Link to="/pricing" className={`menu__link ${className || ''}`}>
          {label}
        </Link>
      </li>
    );
  }

  return (
    <Link to="/pricing" className={`${className || ''} navbar-pricing-link`}>
      {label}
    </Link>
  );
}
