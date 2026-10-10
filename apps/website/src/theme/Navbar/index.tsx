import React, { type ReactNode } from 'react';
import { useLocation } from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Link from '@docusaurus/Link';
import { ArrowLeft } from 'lucide-react';
import NavbarLayout from '@theme/Navbar/Layout';
import NavbarContent from '@theme/Navbar/Content';
import { KRITZEL_LOGO_PATH } from '@site/src/components/Landing/paths';

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
              {/* same logo and wordmark as the landing pages' hero (Landing/Hero.tsx) */}
              <Link to="/" className="blog-navigation-logo">
                <svg width="40" height="35" viewBox="0 0 321.05759 277.97299" aria-hidden="true">
                  <path fill="currentColor" d={KRITZEL_LOGO_PATH} />
                </svg>
                Kritzel
              </Link>
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
