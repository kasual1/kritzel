import React, { type ReactNode } from 'react';
import { useLocation } from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';
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
          <div className="navbar__inner">
            <NavbarLogo />
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
