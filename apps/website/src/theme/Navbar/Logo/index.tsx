import React, { type ReactNode } from 'react';
import UpmadeBrand from '@site/src/components/UpmadeBrand';

/**
 * The docs navbar shows the same logo + name as the landing, agentic and blog headers (instead of Docusaurus'
 * <img> logo and title). `navbar__brand` keeps Infima's navbar layout and the rules in css/navbar.css.
 */
export default function NavbarLogo(): ReactNode {
  return <UpmadeBrand className="navbar__brand" />;
}
