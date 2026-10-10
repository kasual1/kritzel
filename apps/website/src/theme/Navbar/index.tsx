import React, { type ReactNode } from 'react';
import { useLocation } from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Link from '@docusaurus/Link';
import { ArrowLeft } from 'lucide-react';
import NavbarLayout from '@theme/Navbar/Layout';
import NavbarContent from '@theme/Navbar/Content';
import NavbarLogo from '@theme/Navbar/Logo';

export default function Navbar(): ReactNode {
  const { pathname } = useLocation();
  const blogPath = useBaseUrl('/blog');
  const isBlogPage = pathname === blogPath || pathname.startsWith(`${blogPath}/`);
  if (isBlogPage) {
    return (
      <header className="blog-navigation">
        <div className="navbar">
          <div className="navbar__inner container">
            <div className="blog-navigation-brand">
              <NavbarLogo />
            </div>
            <Link
              to={blogPath}
              className="blog-navigation-back"
              aria-label="Back to blog overview"
              title="Back to blog overview"
            >
              <ArrowLeft size={28} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <NavbarLayout>
      <NavbarContent />
    </NavbarLayout>
  );
}
