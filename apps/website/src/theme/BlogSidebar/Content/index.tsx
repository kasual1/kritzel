import React, { type ReactNode } from 'react';
import BlogSidebarContent from '@theme-original/BlogSidebar/Content';
import NavbarLogo from '@theme/Navbar/Logo';
import type { Props } from '@theme/BlogSidebar/Content';

export default function BlogSidebarContentWrapper(props: Props): ReactNode {
  return (
    <>
      <div className="blog-sidebar-brand">
        <NavbarLogo />
      </div>
      <BlogSidebarContent {...props} />
    </>
  );
}
